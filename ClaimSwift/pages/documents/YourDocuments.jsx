import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, TouchableOpacity, ActivityIndicator, Alert
} from "react-native";
import * as DocumentPicker from "expo-document-picker"; // Pick PDFs, DOCX
import * as ImagePicker from "expo-image-picker"; // Capture Images
import { getDocuments, uploadDocument, deleteDocument } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { MaterialIcons } from "@expo/vector-icons";
import tw from "tailwind-react-native-classnames";

// ✅ Define the available document types
const documentTypes = {
    rc: { name: "RC of Car", icon: "directions-car" },
    insurance: { name: "Insurance Document", icon: "verified-user" },
    license: { name: "License", icon: "credit-card" }
};

const YourDocuments = () => {
    const { user } = useGlobalContext();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Fetch user documents only once
    const fetchDocuments = useCallback(async () => {
        if (!user?.$id) return;

        setLoading(true);
        try {
            console.log("Fetching user documents..."); // ✅ Debugging check
            const userDocs = await getDocuments(user.$id);

            // ✅ Merge fetched documents with available document types
            const mergedDocs = Object.keys(documentTypes).map((docKey) => ({
                key: docKey,
                ...documentTypes[docKey],
                uploaded: userDocs.find((doc) => doc.type === docKey) || null
            }));

            setDocuments(mergedDocs);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // ✅ Handle file selection and upload
    const handleFileSelection = async (docKey, isImage = false) => {
        let result;
        if (isImage) {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission Denied", "You need camera permission to take pictures.");
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1, // Highest quality
            });
        } else {
            result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "application/msword", "image/jpeg", "image/png"],
            });
        }

        if (result.canceled) return;

        // Extract the file from the result
        const file = isImage ? result.assets[0] : result.assets[0];

        // Ensure the file object is in the correct format
        if (!file || !file.uri) {
            Alert.alert("Error", "Failed to retrieve file. Please try again.");
            return;
        }

        setLoading(true);
        try {
            // Convert the file URI to a Blob
            const response = await fetch(file.uri);
            const blob = await response.blob();

            // Upload the file to Appwrite Storage
            const fileUpload = await uploadDocument(user.$id, blob, docKey, file.name, file.mimeType);

            // Update the documents state with the uploaded file
            setDocuments((prev) =>
                prev.map((doc) => (doc.key === docKey ? { ...doc, uploaded: fileUpload } : doc))
            );

            Alert.alert("Success", "Document uploaded successfully");
        } catch (error) {
            console.error("Error uploading document:", error);
            Alert.alert("Error", "Failed to upload document");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Delete document
    const handleDelete = async (docKey) => {
        Alert.alert("Delete", "Are you sure you want to delete this document?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                onPress: async () => {
                    setLoading(true);
                    try {
                        await deleteDocument(user.$id, docKey);
                        setDocuments((prev) =>
                            prev.map((doc) => (doc.key === docKey ? { ...doc, uploaded: null } : doc))
                        );
                        Alert.alert("Success", "Document deleted successfully");
                    } catch (error) {
                        console.error("Error deleting document:", error);
                        Alert.alert("Error", "Failed to delete document");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    return (
        <View style={tw`p-6 bg-gray-900 flex-1`}>
            <Text style={tw`text-3xl font-bold text-white mb-6 tracking-wide`}>📄 Your Documents</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#FFA001" />
            ) : (
                // ✅ Convert `documents` object into an array before mapping
                Array.isArray(documents) && documents.length > 0 ? (
                    documents.map((doc) => (
                        <View key={doc.key} style={tw`bg-gray-800 p-5 rounded-xl mb-4 shadow-lg`}>
                            {/* Header Section with Icon */}
                            <View style={tw`flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center`}>
                                    <MaterialIcons name={doc.icon} size={28} color="#FFA001" />
                                    <Text style={tw`text-lg text-white font-semibold ml-3`}>{doc.name}</Text>
                                </View>
                                {doc.uploaded && (
                                    <TouchableOpacity onPress={() => Alert.alert("View", "Open document in browser")}>
                                        <MaterialIcons name="visibility" size={24} color="#4ADE80" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Buttons for Upload, Edit, Delete */}
                            <View style={tw`mt-4 flex-row justify-between`}>
                                {doc.uploaded ? (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => handleFileSelection(doc.key, false)}
                                            style={tw`bg-blue-600 px-4 py-2 rounded-lg flex-1 mx-1`}
                                        >
                                            <Text style={tw`text-white text-center`}>✏️ Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDelete(doc.key)}
                                            style={tw`bg-red-600 px-4 py-2 rounded-lg flex-1 mx-1`}
                                        >
                                            <Text style={tw`text-white text-center`}>🗑️ Delete</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => handleFileSelection(doc.key, false)}
                                            style={tw`bg-green-600 px-4 py-2 rounded-lg flex-1 mx-1`}
                                        >
                                            <Text style={tw`text-white text-center`}>📂 Upload File</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleFileSelection(doc.key, true)}
                                            style={tw`bg-yellow-500 px-4 py-2 rounded-lg flex-1 mx-1`}
                                        >
                                            <Text style={tw`text-black text-center`}>📸 Take Picture</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={tw`text-white text-center mt-5`}>No documents found.</Text>
                )
            )}
        </View>
    );
};

export default YourDocuments;