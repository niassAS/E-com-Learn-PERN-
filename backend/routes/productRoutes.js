import expres from "express";
import { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct } from "../controllers/productController.js";


const router = expres.Router();

// Affichage des produits
router.get("/", getAllProducts);
router.get("/:id", getProduct); // Affiche un prod grace id

// Création des prods
router.post("/", createProduct);

// Modification d'un prod
router.put("/:id", updateProduct);

// Modification d'un prod
router.delete("/:id", deleteProduct);


export default router; // Permet d'exporter le routeur pour pouvoir l'importer et l'utiliser dans un autre fichier.