import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcrypt'

// Update user account information (name, email, password)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    let { firstName, lastName, phone, email, currentPassword, newPassword } = body

    // Normalize email to lowercase (email addresses are case-insensitive per RFC 5321)
    if (email) {
      email = email.toLowerCase().trim()
    }

    // Validate at least one field is provided
    if (!firstName && !lastName && !phone && !email && !newPassword) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // If changing email, check it's not already taken
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // If changing password, verify current password
    let hashedPassword = undefined
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        )
      }

      // Verify current password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id }
      })

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const passwordMatch = await bcrypt.compare(currentPassword, currentUser.password)
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Hash new password
      hashedPassword = await bcrypt.hash(newPassword, 10)
    }

    // Update user
    const updateData: any = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (email) updateData.email = email
    if (hashedPassword) updateData.password = hashedPassword

    // Automatically update name field for backwards compatibility
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName !== undefined ? firstName : user.firstName || ''
      const newLastName = lastName !== undefined ? lastName : user.lastName || ''
      updateData.name = `${newFirstName} ${newLastName}`.trim()
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'Account updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

