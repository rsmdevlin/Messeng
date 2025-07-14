import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createAdmin() {
  const adminUsers = [
    {
      username: "Roman",
      email: "admin@example.com",
      password: "admin123",
      role: "admin"
    },
    {
      username: "basacapone",
      email: "basacapone@gmail.com",
      password: "admin123",
      role: "admin"
    },
    {
      username: "Sosihui228",
      email: "sosihui228@example.com",
      password: "admin123",
      role: "admin"
    }
  ];

  for (const admin of adminUsers) {
    try {
      // Check if admin already exists
      const existingAdmin = await db.select().from(users).where(eq(users.email, admin.email));
      
      if (existingAdmin.length > 0) {
        console.log(`Admin ${admin.username} already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      // Create admin user
      await db.insert(users).values({
        username: admin.username,
        email: admin.email,
        password: hashedPassword,
        role: admin.role,
        status: "online",
        isOnline: true
      });

      console.log(`Admin ${admin.username} created successfully`);
    } catch (error) {
      console.error(`Error creating admin ${admin.username}:`, error);
    }
  }
}

createAdmin().then(() => {
  console.log("Admin creation completed");
  process.exit(0);
}).catch(error => {
  console.error("Error in admin creation:", error);
  process.exit(1);
});