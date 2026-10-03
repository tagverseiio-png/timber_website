"use client";

import { useState, useEffect } from "react";
import { ref, set, onValue, remove, update } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import Image from "next/image";
import { ALL_PRODUCTS } from "@/app/projects/reference/shop_data_backup";

const CATEGORIES = [
  "All", "2 Seaters", "3 Seaters", "Bar Units", "Book Shelves", "Buffets", 
  "Chest Boxes", "Chest of Draws", "Diwans", "Misc", "Outdoor", "Puja Units", 
  "Shoe Racks", "Showcases", "Sofas", "Wardrobes", "Souvenirs", "Cots", 
  "Chairs", "Wallmounts and Mirrors"
];

// 5 Seeds to push to Firebase
const SEEDS = [
  {
    "id": 1,
    "title": "The Grand Sofa Collection",
    "type": "Living Room",
    "category": "Sofas",
    "description": "A masterful centerpiece for any living space, combining rich timber grains with ultimate comfort and structural integrity.",
    "price": 1299.99,
    "image": "/images/sofa.JPG",
    "orderIndex": 1
  },
  {
    "id": 2,
    "title": "Coastal Retreat Bed",
    "type": "Bedroom",
    "category": "Cots",
    "description": "A solid timber bedframe crafted for restful nights and timeless aesthetics.",
    "price": 899.99,
    "image": "/images/cots.jpg",
    "orderIndex": 2
  },
  {
    "id": 3,
    "title": "The Executive Bar",
    "type": "Entertainment",
    "category": "Bar Units",
    "description": "An elegant home bar unit featuring premium wood finishes and smart storage solutions.",
    "price": 1599.99,
    "image": "/images/bar_unit.jpg",
    "orderIndex": 3
  },
  {
    "id": 4,
    "title": "The Modern 2-Seater",
    "type": "Seating",
    "category": "2 Seaters",
    "description": "A stylish and comfortable two-seater sofa, crafted with premium timber and plush upholstery for cozy spaces.",
    "price": 799.99,
    "image": "/images/2%20seater.jpg",
    "orderIndex": 4
  },
  {
    "id": 5,
    "title": "Urban Oasis Terrace",
    "type": "Outdoor",
    "category": "Outdoor",
    "description": "Weather-ready timber seating built to withstand the elements while bringing warmth to your garden.",
    "price": 499.99,
    "image": "/images/outdoor.jpg",
    "orderIndex": 5
  }
];

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Editing
  const [editingProduct, setEditingProduct] = useState<any>(null);
  // State for Category Filter
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        const projectsRef = ref(database, 'projects');
        onValue(projectsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const projectsArray = Object.keys(data).map(key => ({
              firebaseKey: key,
              ...data[key]
            })).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            setProjects(projectsArray);
          } else {
            setProjects([]);
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert("Error logging in: " + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const pushSeeds = async () => {
    try {
      const projectsRef = ref(database, 'projects');
      
      const projectsObject = ALL_PRODUCTS.reduce((acc: any, curr: any, index) => {
        acc[`project_${curr.id}`] = {
          title: curr.name,
          category: curr.category,
          price: curr.price,
          description: `${curr.woodType} with ${curr.rating} star rating.`,
          image: curr.image,
          type: curr.category,
          orderIndex: index
        };
        return acc;
      }, {});
      
      await set(projectsRef, projectsObject);
      alert("Successfully pushed ALL products to Firebase!");
    } catch (error: any) {
      alert("Error pushing seeds: " + error.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      const productRef = ref(database, `projects/${editingProduct.firebaseKey}`);
      // Remove firebaseKey from the object we save to DB
      const { firebaseKey, ...dataToSave } = editingProduct;
      
      // Ensure price and orderIndex are numbers
      dataToSave.price = Number(dataToSave.price);
      dataToSave.orderIndex = Number(dataToSave.orderIndex);
      
      await update(productRef, dataToSave);
      setEditingProduct(null); // Close modal
    } catch (error: any) {
      alert("Error saving updates: " + error.message);
    }
  };

  const normalizeCategory = (cat: string) => cat?.toLowerCase().replace(/s$/, '') || '';

  const displayedProjects = selectedCategory === "All" 
    ? projects 
    : projects.filter(p => normalizeCategory(p.category) === normalizeCategory(selectedCategory));

  if (loading) {
    return <div className="min-h-screen bg-timber-beige flex items-center justify-center font-serif">Loading Admin Panel...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-3xl font-serif text-timber-darkwood mb-2 text-center">Admin Portal</h1>
          <p className="text-gray-500 text-sm text-center mb-6">Authenticate to access the backend</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-timber-darkwood text-timber-beige py-2 rounded-md hover:opacity-90 transition font-medium"
            >
              Log In
            </button>
          </form>
          <div className="mt-6 text-xs text-red-500 text-center font-medium bg-red-50 p-2 rounded">
            Note: Add your Firebase API keys to lib/firebase.ts to enable authentication.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-timber-beige pt-24 pb-12 px-6 relative">
      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-timber-darkwood">
                {editingProduct.firebaseKey.startsWith('new_') ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-gray-800">
                ✕ Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingProduct.title || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingProduct.category || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood bg-white"
                  >
                    <option value="" disabled>Select Category</option>
                    {CATEGORIES.filter(c => c !== "All").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type (e.g., Living Room)</label>
                  <input
                    type="text"
                    value={editingProduct.type || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Upload (JPG/PNG)</label>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingProduct({ ...editingProduct, image: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                />
                {editingProduct.image && (
                  <p className="text-xs text-green-600 mt-1">Image loaded successfully (preview ready to save).</p>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="font-serif text-3xl text-timber-darkwood">Product Management</h1>
            <p className="text-gray-500 text-sm mt-1">Firebase Realtime Database</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border-l-4 border-timber-darkwood">
          <h2 className="text-xl font-serif text-timber-darkwood mb-2">Migrate Storefront Data</h2>
          <p className="text-gray-600 mb-4 text-sm max-w-2xl">
            Click the button below to push all hardcoded products from your backup directly into the Firebase database. This will overwrite existing products with the same IDs.
          </p>
          <button
            onClick={pushSeeds}
            className="px-6 py-2.5 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition font-medium text-sm flex items-center gap-2"
          >
            Push All Hardcoded Data to Database
          </button>
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === category
                  ? "bg-[#1f4a47] text-white border-[#1f4a47]" // Matching the dark green from the screenshot
                  : "bg-transparent text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-serif text-timber-darkwood">Live Products ({displayedProjects.length})</h2>
            <button 
              onClick={() => setEditingProduct({ firebaseKey: `new_${Date.now()}`, title: '', type: '', category: '', description: '', price: 0, image: '', orderIndex: projects.length + 1 })}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
            >
              + Add New Product
            </button>
          </div>
          
          {displayedProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic">No products found for this category.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Image</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Details</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedProjects.map((project) => (
                    <tr key={project.firebaseKey} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                          {project.image && (
                            <Image 
                              src={project.image} 
                              alt={project.title || 'Product'} 
                              fill 
                              className="object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{project.title}</div>
                        <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">{project.description}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase tracking-wider">
                          {project.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        ₹{project.price}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => setEditingProduct(project)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-4"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this product?')) {
                              const refToDelete = ref(database, `projects/${project.firebaseKey}`);
                              remove(refToDelete);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
