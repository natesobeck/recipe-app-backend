import prisma from "../prisma/prismaClient/prismaClient.js"

async function index(req, res) {
  try {
    // Retrieve all profiles using Prisma Client
    const profiles = await prisma.profile.findMany()

    // Respond with the retrieved profiles
    res.json(profiles)
  } catch (err) {
    // Handle errors
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export { index }
