import { useState, useEffect } from 'react';
import { getReferenceData, saveViralPost, uploadPDF, deleteReferenceItem } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import { Plus, FileText, MessageSquare, Trash2, Upload } from 'lucide-react';
import './ReferenceDatabase.css';

const ReferenceDatabase = ({ user, isPremium }) => {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAddPDF, setShowAddPDF] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadReferences();
  }, [user]);

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
      setShowAddPost(false);
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
      setShowAddPDF(false);
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

    if (!confirm('Are you sure you want to delete this reference?')) {
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
        <div className="premium-card">
          <h2>Premium Feature</h2>
          <p>Upgrade to Premium to access the Reference Database</p>
          <p className="premium-description">
            Build your AI's knowledge base with your viral posts and PDF documents.
            The AI will use these references to enhance your posts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reference-database">
      <div className="database-header">
        <div>
          <h2>Reference Database</h2>
          <p className="subtitle">
            Your viral posts and PDFs that guide AI enhancements
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowAddPost(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Add Viral Post
          </button>
          <label className="btn btn-secondary">
            <Upload size={18} />
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleUploadPDF}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {showAddPost && (
        <div className="add-post-modal">
          <div className="modal-content">
            <h3>Add Viral Post</h3>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Paste your viral post here..."
              className="post-input"
              rows={6}
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAddPost(false);
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

      {loading ? (
        <div className="loading">Loading reference database...</div>
      ) : references.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
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
                    <FileText size={20} />
                  ) : (
                    <MessageSquare size={20} />
                  )}
                </div>
                <button
                  onClick={() => handleDelete(ref.id)}
                  className="delete-btn"
                  title="Delete"
                >
                  <Trash2 size={16} />
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
