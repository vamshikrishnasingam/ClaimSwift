import {
  Account,
  Client,
  ID,
  Avatars,
  Databases,
  Query,
  Storage
} from "react-native-appwrite";
export const appWriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.vpvs.claimswift",
  projectId: "67288940003bb07c9b79",
  databaseId: "67288ae600282a77016d",
  userCollectionId: "67288b88003647e3c75c",
  videoCollectionId: "67288ba700234918152e",
  carCollectionId: "67d06d0c0003eae9b4d9",
  documentsCollectionId: "67d173c70027e6bbbf5b",
  storageId: "67288db400064577c1cd",
  claimsCollectionId: "67d1b0330019dd58e1ff",
};

// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(appWriteConfig.endpoint)
  .setProject(appWriteConfig.projectId)
  .setPlatform(appWriteConfig.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);


//Users
export const createUser = async (email, password, username) => {
  // Register User
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    if (!newAccount) {
      throw Error;
    }
    const avatarUrl = avatars.getInitials(username);
    await signIn(email, password);
    const newUser = await databases.createDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

//signIn
export const signIn = async (email, password) => {
  try {
    // // Check for active sessions
    // const sessions = await account.listSessions();
    // if (sessions.total > 0) {
    //   // Session already exists, return the active session
    //   return sessions.sessions[0];
    // }

    // Create a new session if none exists
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error("Sign-in error:", error);
    throw new Error(error);
  }
};
// Sign Out
export const signOut = async () => {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
};

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}
// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}



//Update UserName
export const updateUsername = async (userId, newUsername) => {
  try {
    const response = await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.userCollectionId,
      userId,
      {
        username: newUsername,
      }
    );
    return response;
  } catch (error) {
    console.error("Failed to update username:", error);
    throw error;
  }
};

//Car

//add car details
export const addCarDetails = async (user, Brand, Model, car_number) => {
  try {
    const response = await databases.createDocument(
      appWriteConfig.databaseId,
      appWriteConfig.carCollectionId,
      ID.unique(), // Unique ID for the car document
      {
        user,
        Brand,
        Model,
        car_number,
        date_uploaded: new Date().toISOString(), // Add the current date and time
      }
    );
    return response; // Return the created car document
  } catch (error) {
    console.error("Error adding car details:", error);
    throw new Error(error);
  }
};

//get car details
export const getCarDetails = async (user) => {
  try {
    const response = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.carCollectionId,
      [Query.equal("user", [user])] // Filter by user relationship
    );
    return response.documents; // Return the list of car documents
  } catch (error) {
    console.error("Error fetching car details:", error);
    throw new Error(error);
  }
};

// updateCarDetails
export const updateCarDetails = async (carId, brand, model, carNumber) => {
  try {
    await databases.updateDocument(
      appWriteConfig.databaseId,
      appWriteConfig.carCollectionId,
      carId,
      {
        Brand: brand,
        Model: model,
        car_number: carNumber,
      }
    );
    return true; // Successfully updated
  } catch (error) {
    console.error("Error updating car details:", error);
    throw new Error(error);
  }
};
//delete car details
export const deleteCarDetails = async (carId) => {
  try {
    await databases.deleteDocument(
      appWriteConfig.databaseId,
      appWriteConfig.carCollectionId,
      carId
    );
    return true; // Successfully deleted
  } catch (error) {
    console.error("Error deleting car details:", error);
    throw new Error(error);
  }
};

//get all posts
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.videoCollectionId
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};

//get all posts
export const getLastestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt", Query.limit(7))]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};

//get Search Result posts
export const getSearchResults = async (query) => {
  try {
    const posts = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};

//get UserPost
export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};


/**
 * Fetch all documents uploaded by a specific user.
 */
export const getDocuments = async (userId) => {
  try {
    console.log("Fetching documents for user:", userId);

    const docList = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.documentsCollectionId,
      [Query.equal("user", userId)]
    );

    console.log("Fetched Documents:", docList.documents);
    return docList.documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

/**
 * Upload a document to Appwrite Storage and save metadata in Database.
 */
export const uploadDocument = async (userId, fileBlob, docType, fileName, mimeType) => {
  try {
    console.log("Uploading file:", fileName);

    // Upload the file to Appwrite Storage
    const fileUpload = await storage.createFile(
      appWriteConfig.storageId,
      ID.unique(),
      fileBlob
    );

    console.log("File uploaded successfully:", fileUpload);

    // Generate file preview/download URL
    const fileUrl = storage.getFileView(appWriteConfig.storageId, fileUpload.$id);

    // Save metadata in Appwrite Database
    const newDocument = await databases.createDocument(
      appWriteConfig.databaseId,
      appWriteConfig.documentsCollectionId,
      ID.unique(),
      {
        user: userId,
        type: docType,
        fileId: fileUpload.$id,
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString(),
      }
    );

    console.log("Document metadata saved:", newDocument);
    return newDocument;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

/**
 * Delete a document from both Appwrite Storage and Database.
 */
export const deleteDocument = async (userId, docType) => {
  try {
    console.log("Deleting document of type:", docType, "for user:", userId);

    // Fetch user's documents
    const userDocs = await getDocuments(userId);
    const docToDelete = userDocs.find(doc => doc.type === docType);

    if (!docToDelete) {
      throw new Error("Document not found.");
    }

    // Delete file from storage
    await storage.deleteFile(appWriteConfig.storageId, docToDelete.fileId);

    // Delete metadata from database
    await databases.deleteDocument(appWriteConfig.databaseId, appWriteConfig.documentsCollectionId, docToDelete.$id);

    console.log("Document deleted successfully");
    return { success: true, message: "Document deleted successfully" };
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};


// Function to check car details in the database
export const checkCarinDatabase = async (userId, carNumber) => {
  try {
    // Query the car collection
    const response = await databases.listDocuments(
      appWriteConfig.databaseId,
      appWriteConfig.carCollectionId,
      [
        Query.equal("user", [userId]), // Filter by userId
        Query.equal("car_number", [carNumber]), // Filter by carNumber
      ]
    );
    // If documents are found, return the first document
    if (response.documents.length > 0) {
      return response.documents[0]; // Return the car details
    } else {
      return null; // No matching document found
    }
  } catch (error) {
    console.error("Error checking car details:", error);
    throw error; // Throw the error for handling in the calling function
  }
};
// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appWriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appWriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

//upload files in Storage
export const uploadFileToStorage = async (file, fileName, type) => {
  if (!file) return;
  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };
  try {
    console.log("Uploading file:", file);
    const uploadedFile = await storage.createFile(
      appWriteConfig.storageId,
      ID.unique(),
      asset
    );

    console.log("File upload response:", uploadedFile);

    // Get the file URL
    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

//upload claim in Database
export const createClaimDocument = async (claimData) => {
  try {
    const response = await databases.createDocument(
      appWriteConfig.databaseId, // Your database ID
      appWriteConfig.claimsCollectionId, // Your claims collection ID
      ID.unique(), // Unique document ID
      claimData // Claim data
    );
    console.log(response)
    return response;
  } catch (error) {
    console.error("Error creating claim document:", error);
    throw error;
  }
};

//user claims
// Function to fetch user claims
export const fetchUserClaims = async (userId) => {
  try {
    const response = await databases.listDocuments(
      appWriteConfig.databaseId, // Your database ID
      appWriteConfig.claimsCollectionId, // Your claims collection ID
      [Query.equal("users",[ userId])] // Filter by user_id
    );

    // console.log("API Response:", response); // Log the response

    // If no documents are found, return an empty array
    if (!response.documents || !Array.isArray(response.documents)) {
      return [];
    }

    // Add a status field to each claim (e.g., "Pending" or "Success")
    const claimsWithStatus = response.documents.map((claim) => ({
      ...claim,
      status: Math.random() > 0.5 ? "Success" : "Pending", // Random status for demonstration
    }));

    return claimsWithStatus;
  } catch (error) {
    console.error("Error fetching user claims:", error);
    throw error;
  }
};