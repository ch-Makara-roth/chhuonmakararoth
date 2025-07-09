// MongoDB initialization script for production deployment
// This script sets up the initial database configuration and users

// Switch to admin database
db = db.getSiblingDB('admin');

// Create admin user if it doesn't exist
try {
    db.createUser({
        user: 'admin',
        pwd: process.env.MONGO_ROOT_PASSWORD || 'defaultpassword',
        roles: [
            { role: 'userAdminAnyDatabase', db: 'admin' },
            { role: 'readWriteAnyDatabase', db: 'admin' },
            { role: 'dbAdminAnyDatabase', db: 'admin' }
        ]
    });
    print('Admin user created successfully');
} catch (error) {
    print('Admin user already exists or error creating user: ' + error.message);
}

// Switch to portfolio database
db = db.getSiblingDB('portfolio');

// Create application user for the portfolio database
try {
    db.createUser({
        user: 'portfolio_user',
        pwd: process.env.MONGO_APP_PASSWORD || 'portfoliopass',
        roles: [
            { role: 'readWrite', db: 'portfolio' },
            { role: 'dbAdmin', db: 'portfolio' }
        ]
    });
    print('Portfolio user created successfully');
} catch (error) {
    print('Portfolio user already exists or error creating user: ' + error.message);
}

// Create indexes for better performance
try {
    // Index for contributions collection
    db.contributions.createIndex({ "slug": 1 }, { unique: true });
    db.contributions.createIndex({ "createdAt": -1 });
    db.contributions.createIndex({ "status": 1 });
    db.contributions.createIndex({ "tags": 1 });

    // Index for users collection
    db.users.createIndex({ "email": 1 }, { unique: true });
    db.users.createIndex({ "createdAt": -1 });

    // Index for sessions collection (NextAuth)
    db.sessions.createIndex({ "sessionToken": 1 }, { unique: true });
    db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });

    // Index for accounts collection (NextAuth)
    db.accounts.createIndex({ "provider": 1, "providerAccountId": 1 }, { unique: true });
    db.accounts.createIndex({ "userId": 1 });

    // Index for verification tokens collection (NextAuth)
    db.verification_tokens.createIndex({ "token": 1 }, { unique: true });
    db.verification_tokens.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });

    print('Database indexes created successfully');
} catch (error) {
    print('Error creating indexes: ' + error.message);
}

// Insert initial data if collections are empty
try {
    // Check if contributions collection is empty
    if (db.contributions.countDocuments() === 0) {
        print('Inserting initial contribution data...');

        db.contributions.insertOne({
            title: "Welcome to My Portfolio",
            description: "This is a sample contribution to get you started with the portfolio system.",
            slug: "welcome-contribution",
            codeSnippet: `// Welcome to the interactive code editor
function welcome() {
    console.log("Hello, World!");
    console.log("This is your portfolio system!");

    // You can edit this code and see changes in real-time
    const greeting = "Welcome to my portfolio!";
    return greeting;
}

// Call the function
welcome();`,
            hotspots: [
                {
                    id: "welcome-1",
                    startLine: 1,
                    endLine: 3,
                    area: "Function Declaration",
                    details: "This is a basic JavaScript function that demonstrates how the code editor works."
                },
                {
                    id: "welcome-2",
                    startLine: 7,
                    endLine: 8,
                    area: "Variable Declaration",
                    details: "Here we define a greeting message using const to ensure it cannot be reassigned."
                }
            ],
            tags: ["JavaScript", "Welcome", "Demo"],
            repoLink: "https://github.com/yourusername/portfolio",
            status: "published",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        print('Initial contribution data inserted');
    }
} catch (error) {
    print('Error inserting initial data: ' + error.message);
}

// Set up replica set status check
try {
    var status = rs.status();
    print('Replica set status: ' + status.ok);
} catch (error) {
    print('Replica set not initialized yet: ' + error.message);
}

print('MongoDB initialization completed successfully');
