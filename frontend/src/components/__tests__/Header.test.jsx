import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from '../Header'

describe('Header Component', () => {
  const mockUser = {
    name: 'John Doe',
    role: 'mahasiswa',
  }

  it('menampilkan judul aplikasi', () => {
    render(<Header user={mockUser} isConnected={true} />)
    expect(screen.getByText(/Studyfy/i)).toBeInTheDocument()
  })

  it('menampilkan nama user', () => {
    render(<Header user={mockUser} isConnected={true} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})