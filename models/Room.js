import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    visibility: { type: String, enum: ["public", "private"], default: "private" },
    code: { type: String, unique: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true }
);

// Helper: generate unique 8-char code
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Pre-save: generate code if not present
roomSchema.pre("save", async function (next) {
  if (!this.code) {
    console.log("Generating code for room:", this.name);
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const code = generateCode();
      console.log("Generated code:", code);
      // Use this.constructor instead of mongoose.models.Room to avoid circular reference issues
      const exists = await this.constructor.findOne({ code });
      if (!exists) {
        this.code = code;
        unique = true;
        console.log("Code is unique, assigned:", code);
      } else {
        console.log("Code already exists, trying again");
      }
      attempts++;
    }
    if (!unique) {
      console.error("Failed to generate unique code after 10 attempts");
      return next(new Error("Failed to generate unique room code"));
    }
  }
  next();
});

export default mongoose.model("Room", roomSchema);