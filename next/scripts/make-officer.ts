import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'jjl4287@g.rit.edu'
  
  // Find or create the user
  let user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'JJ Langtry',
        email: email,
        isMember: true,
      }
    })
    console.log('Created user:', user)
  } else {
    console.log('Found existing user:', user)
  }
  
  // Check if there's an officer position, create one if not
  let position = await prisma.officerPosition.findFirst()
  
  if (!position) {
    position = await prisma.officerPosition.create({
      data: {
        title: 'President',
        email: 'president@sse.rit.edu',
        is_primary: true,
      }
    })
    console.log('Created position:', position)
  } else {
    console.log('Found existing position:', position)
  }
  
  // Check if user is already an officer
  const existingOfficer = await prisma.officer.findFirst({
    where: {
      user_id: user.id,
      is_active: true,
    }
  })
  
  if (existingOfficer) {
    console.log('User is already an active officer:', existingOfficer)
    return
  }
  
  // Create officer record
  const officer = await prisma.officer.create({
    data: {
      user_id: user.id,
      position_id: position.id,
      is_active: true,
      start_date: new Date(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }
  })
  
  console.log('Created officer record:', officer)
  console.log('\n✅ User jjl4287@g.rit.edu is now an officer!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
