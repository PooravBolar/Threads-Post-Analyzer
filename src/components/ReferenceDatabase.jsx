import { useState, useEffect } from 'react';
import { getReferenceData, saveViralPost, uploadPDF, deleteReferenceItem } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import { Plus, FileText, MessageSquare, Trash2, Upload, Sparkles } from 'lucide-react';
import { isOwner } from '../utils/owner';
import './ReferenceDatabase.css';

const ReferenceDatabase = ({ user, isPremium }) => {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [uploading, setUploading] = useState(false);

  const owner = isOwner(user);

  useEffect(() => {
    if (owner && user) {
      loadReferences();
    } else {
      setLoading(false);
    }
  }, [user?.uid, owner]);

  const loadReferences = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getReferenceData(user.uid);
      setReferences(data);
    } catch (error) {
      toast.error('Error loading reference database');
    } finally {
      setLoading(false);
    }
  };

  const handleAddViralPost = async () => {
    if (!newPost.trim()) {
      toast.error('Please enter a post');
      return;
    }

    if (!isPremium) {
      toast.error('Premium feature. Please upgrade to add viral posts.');
      return;
    }

    try {
      await saveViralPost(user.uid, newPost.trim());
      toast.success('Viral post added to database!');
      setNewPost('');
      setShowAddModal(false);
      loadReferences();
    } catch (error) {
      toast.error('Error adding viral post');
    }
  };

  const handleUploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isPremium) {
      toast.error('Premium feature. Please upgrade to upload PDFs.');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      await uploadPDF(user.uid, file);
      toast.success('PDF uploaded successfully!');
      loadReferences();
    } catch (error) {
      toast.error('Error uploading PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isPremium) {
      toast.error('Premium feature');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this reference?')) {
      return;
    }

    try {
      await deleteReferenceItem(id);
      toast.success('Reference deleted');
      loadReferences();
    } catch (error) {
      toast.error('Error deleting reference');
    }
  };

  if (!isPremium) {
    return (
      <div className="premium-required">
        <div className="premium-message">
          <h2>Premium Feature</h2>
          <p>Upgrade to Premium to access the Reference Database</p>
          <p className="premium-description">
            Build your AI's knowledge base with your viral posts and PDF documents.
            The AI will use these references to enhance your posts with proven patterns and strategies.
          </p>
        </div>
      </div>
    );
  }

  /* Read-only view for non-owners: show that Poorav Bolar's viral posts are the reference */
  if (!owner) {
    return (
      <div className="reference-database">
        <div className="database-header">
          <div className="database-info">
            <h2>Reference Database</h2>
            <p className="database-subtitle">
              Curated viral content that powers AI enhancements
            </p>
          </div>
        </div>
        <div className="database-readonly-view">
          <div className="database-readonly-card">
            <div className="database-readonly-icon">
              <Sparkles size={40} />
            </div>
            <h3>All of Poorav Bolar&apos;s viral posts are added here as reference</h3>
            <p className="database-readonly-lead">
              This database is packed with viral resources — proven posts and strategies that the AI uses to enhance your content.
            </p>
            <p className="database-readonly-note">
              Use the Analyzer to get recommendations and enhancements powered by these references.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reference-database">
      <div className="database-header">
        <div className="database-info">
          <h2>Reference Database</h2>
          <p className="database-subtitle">
            Your viral posts and PDFs that guide AI enhancements
          </p>
        </div>
        <div className="database-actions">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-add"
          >
            <Plus size={18} />
            Add Viral Post
          </button>
          <label className="btn-upload">
            <Upload size={18} />
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleUploadPDF}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Viral Post</h3>
            </div>
            <div className="modal-body">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Paste your viral post here..."
                className="modal-textarea"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPost('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddViralPost}
                className="btn btn-primary"
              >
                Add to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      ) : references.length === 0 ? (
        <div className="empty-state">
          <FileText size={56} />
          <h3>No References Yet</h3>
          <p>Add your viral posts and PDFs to build your AI's knowledge base</p>
        </div>
      ) : (
        <div className="references-grid">
          {references.map((ref) => (
            <div key={ref.id} className="reference-card">
              <div className="card-header">
                <div className="card-icon">
                  {ref.type === 'pdf' ? (
                    <FileText size={22} />
                  ) : (
                    <MessageSquare size={22} />
                  )}
                </div>
                <button
                  onClick={() => handleDelete(ref.id)}
                  className="delete-button"
                  title="Delete"
                  aria-label="Delete reference"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="card-content">
                {ref.type === 'pdf' ? (
                  <>
                    <h4>{ref.fileName}</h4>
                    <p className="card-meta">
                      Uploaded {new Date(ref.uploadedAt).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="card-text">{ref.postText}</p>
                    <p className="card-meta">
                      Added {new Date(ref.createdAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceDatabase;
