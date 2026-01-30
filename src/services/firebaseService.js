import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

/**
 * Check if user has premium access
 */
export const checkPremiumAccess = async (userId) => {
  try {
    if (!db || !userId) {
      return false;
    }
    
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isPremium === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
};

/**
 * Save viral post to reference database
 */
export const saveViralPost = async (userId, postText, metadata = {}) => {
  try {
    const viralPost = {
      userId,
      postText,
      metadata,
      createdAt: new Date().toISOString(),
      type: 'viral_post'
    };
    
    const docRef = await addDoc(collection(db, 'referenceDatabase'), viralPost);
    return docRef.id;
  } catch (error) {
    console.error('Error saving viral post:', error);
    throw error;
  }
};

/**
 * Get all reference data (viral posts and PDFs) for a user
 */
export const getReferenceData = async (userId) => {
  try {
    const q = query(
      collection(db, 'referenceDatabase'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const references = [];
    
    querySnapshot.forEach((doc) => {
      references.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return references;
  } catch (error) {
    console.error('Error getting reference data:', error);
    return [];
  }
};

/**
 * Upload PDF and extract text
 */
export const uploadPDF = async (userId, file) => {
  try {
    // Upload file to Firebase Storage
    const storageRef = ref(storage, `pdfs/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Save PDF reference to Firestore
    const pdfRef = {
      userId,
      fileName: file.name,
      downloadURL,
      uploadedAt: new Date().toISOString(),
      type: 'pdf',
      // Note: PDF text extraction would need to be done client-side or via a service
      // For now, we'll store the URL and extract text when needed
    };
    
    const docRef = await addDoc(collection(db, 'referenceDatabase'), pdfRef);
    return { id: docRef.id, ...pdfRef };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

/**
 * Delete reference item
 */
export const deleteReferenceItem = async (itemId) => {
  try {
    await deleteDoc(doc(db, 'referenceDatabase', itemId));
    return true;
  } catch (error) {
    console.error('Error deleting reference item:', error);
    throw error;
  }
};

/**
 * Save analysis result
 */
export const saveAnalysisResult = async (userId, postText, scores, analysis) => {
  try {
    const result = {
      userId,
      postText,
      scores,
      analysis,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'analysisHistory'), result);
    return docRef.id;
  } catch (error) {
    console.error('Error saving analysis result:', error);
    throw error;
  }
};

/**
 * Get analysis history for a user
 */
export const getAnalysisHistory = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'analysisHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history;
  } catch (error) {
    console.error('Error getting analysis history:', error);
    return [];
  }
};
