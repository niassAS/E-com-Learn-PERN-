import express from "express";
import helmet from "helmet"; // Est un middleware qui permet la sécurité du backend
import morgan from "morgan"; // Permet de suivre les requêtes HTTP envoyées sur le serveur
import cors from "cors"; // Un middleware qui permet la gestion des communication entre dif≠ origine
import dotenv from "dotenv"; // Permet de charger les variables d'environnement
import path from "path"; // permet manipuler les chemins des fichiers et docs de l'app
import productRoutes from "./routes/productRoutes.js";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(express.json()); // Permet au serveur Express de recevoir, lire et traiter les données envoyées au format JSON
app.use(cors());
app.use(helmet()); // Activation de Helmet
app.use(morgan("dev")); // Activation de Morgan

app.use(async (req, res, next) => {
    try {
        const decision = await aj.protect(req, {
            requested: 1, // specifies that each request consumes 1 token
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                res.status(429).json({ error: "Too Many Requests" });
            } else if (decision.reason.isBot()) {
                res.status(403).json({ error: "Bot access denied" });
            } else {
                res.status(403).json({ error: "Forbidden" });
            }
            return;
        }

        // check for spoofed bots
        if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            res.status(403).json({ error: "Spoofed bot detected" });
            return;
        }

        next();
    } catch (error) {
        console.log("Arcjet error", error);
        next(error);
    }
});

// Permet de créer une route et lorsqu'un client visite le site ce qu'il voit sur la page d'acueil
app.use("/api/products", productRoutes);

if (process.env.NODE_ENV==="production") {
    app.use(express.static(path.join(__dirname,"/frontend/dist")))

    app.get("/{*splat}", (req,res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

async function initDB(params) {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Database initialized successfully");
    } catch (error) {
        console.log("Error initDB", error);
    }
}

initDB().then(() => {
    // Permet le démarrage du serveur
    app.listen(PORT, () => {
        console.log("Server is running on port " + PORT);
    });
});

// console.log(res.getHeaders()); // Permet d'afficher dans le terminal les en-têtes HTTP de la réponse envoyée par le serveur.