"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabaseConnection = closeDatabaseConnection;
const client_1 = require("@prisma/client");
exports.db = new client_1.PrismaClient();
async function initializeDatabase() {
    try {
        await exports.db.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }
}
async function closeDatabaseConnection() {
    await exports.db.$disconnect();
}
//# sourceMappingURL=database.js.map