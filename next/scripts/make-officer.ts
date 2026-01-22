/**
 * DEPRECATED: This script is no longer recommended.
 * 
 * The invitation system should be used instead:
 * 
 * 1. Sign in to the SSE website with any RIT Google account
 * 2. Navigate to Dashboard → Positions
 * 3. Click "Invite" on any position
 * 4. Enter the person's @g.rit.edu email address
 * 5. They will receive an email with instructions to sign in and accept
 * 
 * This ensures proper OAuth Account records are created by NextAuth,
 * avoiding the "To confirm your identity, sign in with the same account"
 * error that occurs when users are manually created.
 * 
 * =====================================================================
 * 
 * BOOTSTRAP INVITATION SCRIPT
 * 
 * Use this script ONLY for initial setup when there are no officers
 * to send invitations through the dashboard.
 * 
 * Usage:
 *   EMAIL=someone@g.rit.edu POSITION="President" npx ts-node scripts/make-officer.ts
 * 
 * The invitation will be created in the database. The user can then:
 * 1. Go to the SSE website
 * 2. Sign in with their RIT Google account
 * 3. They will be redirected to accept the invitation
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.EMAIL
  const positionTitle = process.env.POSITION || 'President'
  
  if (!email) {
    console.error('❌ ERROR: EMAIL environment variable is required')
    console.log('Usage: EMAIL=someone@g.rit.edu POSITION="President" npx ts-node scripts/make-officer.ts')
    process.exit(1)
  }
  
  if (!email.endsWith('@g.rit.edu')) {
    console.error('❌ ERROR: Email must be an @g.rit.edu address')
    process.exit(1)
  }
  
  // Find the position
  const position = await prisma.officerPosition.findFirst({
    where: { title: positionTitle }
  })
  
  if (!position) {
    console.error(`❌ ERROR: Position "${positionTitle}" not found`)
    console.log('Available positions:')
    const positions = await prisma.officerPosition.findMany({
      select: { title: true }
    })
    positions.forEach(p => console.log(`  - ${p.title}`))
    process.exit(1)
  }
  
  // Check if there's already an active officer for this position
  const activeOfficer = await prisma.officer.findFirst({
    where: {
      position_id: position.id,
      is_active: true
    },
    include: {
      user: true
    }
  })
  
  if (activeOfficer) {
    console.error(`❌ ERROR: Position "${positionTitle}" already has an active officer: ${activeOfficer.user.email}`)
    console.log('Remove them first through the dashboard or database.')
    process.exit(1)
  }
  
  // Check if there's already a pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      invitedEmail: email,
      type: 'officer',
      positionId: position.id
    }
  })
  
  if (existingInvitation) {
    console.log(`ℹ️  An invitation already exists for ${email} as ${positionTitle}`)
    console.log(`Created: ${existingInvitation.createdAt}`)
    console.log(`Expires: ${existingInvitation.expiresAt}`)
    return
  }
  
  // Find any user to set as inviter (for bootstrap, we'll use system)
  // In a real scenario, this should be an existing officer
  let inviter = await prisma.user.findFirst()
  
  // If no users exist yet, we need to create a placeholder
  // This should only happen on initial setup
  if (!inviter) {
    console.log('⚠️  No users exist yet. Creating bootstrap invitation without inviter tracking.')
    // We can't create an invitation without an inviter due to foreign key constraint
    // In this case, the person needs to sign in first, then be manually assigned
    console.log('')
    console.log('BOOTSTRAP INSTRUCTIONS:')
    console.log('1. Go to the website and sign in with your RIT Google account')
    console.log('2. Run this script again - it will then create a proper invitation')
    process.exit(0)
  }
  
  // Create the invitation
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)
  
  const startDate = new Date()
  startDate.setMonth(7) // August
  startDate.setDate(1)
  if (startDate < new Date()) {
    startDate.setFullYear(startDate.getFullYear() + 1)
  }
  
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)
  endDate.setMonth(4) // May
  endDate.setDate(31)
  
  const invitation = await prisma.invitation.create({
    data: {
      invitedEmail: email,
      type: 'officer',
      positionId: position.id,
      startDate,
      endDate,
      invitedBy: inviter.id,
      expiresAt
    }
  })
  
  console.log('✅ Invitation created!')
  console.log('')
  console.log(`Position: ${positionTitle}`)
  console.log(`Email: ${email}`)
  console.log(`Term: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`)
  console.log(`Expires: ${expiresAt.toLocaleDateString()}`)
  console.log('')
  console.log('Next steps:')
  console.log(`1. Tell ${email} to go to the SSE website`)
  console.log('2. They should sign in with their RIT Google account')
  console.log('3. They will see a prompt to accept the officer position')
  console.log('')
  console.log('NOTE: No email was sent. You need to notify them manually.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
