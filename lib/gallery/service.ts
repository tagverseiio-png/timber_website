import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { firestore, storage } from "@/lib/firebase";
import {
  toGalleryItem,
  validateGalleryFile,
  type GalleryItem,
  type RawGalleryDoc,
} from "@/lib/gallery/types";

const GALLERY_COLLECTION = "gallery";
const GALLERY_STORAGE_DIR = "gallery";

export interface UploadMetadataInput {
  title: string;
  description: string;
  category: string;
  orderIndex: number;
  isActive: boolean;
}

interface StoredUploadResult {
  imageUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

function buildSafeStoragePath(fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${GALLERY_STORAGE_DIR}/${Date.now()}_${suffix}_${sanitized}`;
}

/** Upload an image file to Firebase Storage with live percentage progress. */
function uploadFileToStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<StoredUploadResult> {
  const validationError = validateGalleryFile(file);
  if (validationError) {
    return Promise.reject(new Error(validationError));
  }

  const path = buildSafeStoragePath(file.name);
  const fileRef = storageRef(storage, path);
  const task = uploadBytesResumable(fileRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
    },
  });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(pct);
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const imageUrl = await getDownloadURL(task.snapshot.ref);
          resolve({
            imageUrl,
            storagePath: path,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/** Delete a file from Firebase Storage if it exists, ignoring missing-object errors. */
async function deleteFileFromStorage(storagePath: string): Promise<void> {
  if (!storagePath) return;
  try {
    await deleteObject(storageRef(storage, storagePath));
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
    if (code !== "storage/object-not-found") {
      throw err;
    }
  }
}

/**
 * Subscribe to real-time updates from the Firestore `gallery` collection.
 */
export function subscribeGalleryPhotos(
  onData: (items: GalleryItem[]) => void,
  onError: (message: string) => void
): () => void {
  const q = query(collection(firestore, GALLERY_COLLECTION), orderBy("orderIndex", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((snap) => toGalleryItem(snap.id, snap.data() as RawGalleryDoc))
        .sort((a, b) => a.orderIndex - b.orderIndex || (b.createdAt ?? 0) - (a.createdAt ?? 0));
      onData(items);
    },
    (err) => {
      onError(err.message || "Failed to load gallery items from Firestore.");
    }
  );
}

/** Subscribe to active (`isActive === true`) gallery photos for the public frontend. */
export function subscribePublicGalleryPhotos(
  onData: (items: GalleryItem[]) => void,
  onError: (message: string) => void
): () => void {
  const q = query(
    collection(firestore, GALLERY_COLLECTION),
    where("isActive", "==", true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((snap) => toGalleryItem(snap.id, snap.data() as RawGalleryDoc))
        .sort((a, b) => a.orderIndex - b.orderIndex || (b.createdAt ?? 0) - (a.createdAt ?? 0));
      onData(items);
    },
    (err) => {
      onError(err.message || "Failed to load gallery showcase from Firestore.");
    }
  );
}

/**
 * Upload a photo to Firebase Storage and create its metadata document in Firestore.
 */
export async function uploadGalleryPhoto(
  file: File,
  metadata: UploadMetadataInput,
  onProgress?: (percent: number) => void
): Promise<string> {
  const stored = await uploadFileToStorage(file, onProgress);
  const docRef = await addDoc(collection(firestore, GALLERY_COLLECTION), {
    title: metadata.title.trim() || "Untitled Photo",
    description: metadata.description.trim(),
    category: metadata.category.trim() || "Other",
    imageUrl: stored.imageUrl,
    storagePath: stored.storagePath,
    fileName: stored.fileName,
    fileSize: stored.fileSize,
    contentType: stored.contentType,
    orderIndex: metadata.orderIndex,
    isActive: metadata.isActive,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a gallery document in Firestore and optionally replace its image in Storage.
 */
export async function updateGalleryPhoto(
  id: string,
  metadata: UploadMetadataInput,
  options?: {
    newFile?: File;
    previousStoragePath?: string;
    onProgress?: (percent: number) => void;
  }
): Promise<void> {
  let replacement: StoredUploadResult | null = null;
  if (options?.newFile) {
    replacement = await uploadFileToStorage(options.newFile, options.onProgress);
  }

  const docRef = doc(firestore, GALLERY_COLLECTION, id);
  await updateDoc(docRef, {
    title: metadata.title.trim() || "Untitled Photo",
    description: metadata.description.trim(),
    category: metadata.category.trim() || "Other",
    orderIndex: metadata.orderIndex,
    isActive: metadata.isActive,
    ...(replacement
      ? {
          imageUrl: replacement.imageUrl,
          storagePath: replacement.storagePath,
          fileName: replacement.fileName,
          fileSize: replacement.fileSize,
          contentType: replacement.contentType,
        }
      : {}),
    updatedAt: serverTimestamp(),
  });

  if (replacement && options?.previousStoragePath) {
    try {
      await deleteFileFromStorage(options.previousStoragePath);
    } catch {
      // Old asset cleanup failure should not undo an already committed metadata update.
    }
  }
}

/** Toggle visibility (`isActive`) of a gallery item in Firestore. */
export async function setGalleryPhotoVisibility(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(firestore, GALLERY_COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

async function commitVisibilityUpdates(
  updates: Array<{ id: string; isActive: boolean }>
): Promise<void> {
  const BATCH_LIMIT = 400;
  for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
    const batch = writeBatch(firestore);
    for (const entry of updates.slice(i, i + BATCH_LIMIT)) {
      batch.update(doc(firestore, GALLERY_COLLECTION, entry.id), {
        isActive: entry.isActive,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

/** Set visibility (`isActive`) across all provided gallery document IDs. */
export async function setAllGalleryVisibility(
  ids: string[],
  isActive: boolean
): Promise<void> {
  if (ids.length === 0) return;
  await commitVisibilityUpdates(ids.map((id) => ({ id, isActive })));
}

/** Mark only the selected IDs as active (`isActive: true`) and hide all others. */
export async function showOnlySelectedGalleryPhotos(
  allIds: string[],
  selectedIds: string[]
): Promise<void> {
  if (allIds.length === 0) return;
  const selectedSet = new Set(selectedIds);
  await commitVisibilityUpdates(
    allIds.map((id) => ({ id, isActive: selectedSet.has(id) }))
  );
}

/** Permanently delete a gallery item from both Firestore and Firebase Storage. */
export async function deleteGalleryPhoto(item: Pick<GalleryItem, "id" | "storagePath">): Promise<void> {
  await deleteDoc(doc(firestore, GALLERY_COLLECTION, item.id));
  await deleteFileFromStorage(item.storagePath);
}

/**
 * Upsert a Base64-encoded gallery photo directly into Firestore `gallery/{docId}`.
 * Uses deterministic document IDs so re-running website image imports updates cleanly.
 */
export async function upsertGalleryBase64Photo(
  docId: string,
  metadata: UploadMetadataInput & {
    imageUrl: string;
    fileName: string;
    fileSize: number;
    contentType: string;
  }
): Promise<void> {
  await setDoc(
    doc(firestore, GALLERY_COLLECTION, docId),
    {
      title: metadata.title.trim() || "Untitled Photo",
      description: metadata.description.trim(),
      category: metadata.category.trim() || "Other",
      imageUrl: metadata.imageUrl,
      storagePath: "",
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      contentType: metadata.contentType,
      orderIndex: metadata.orderIndex,
      isActive: metadata.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

