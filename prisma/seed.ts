const adminExists = await prisma.user.findFirst({
  where: {
    role: "ADMIN",
  },
});