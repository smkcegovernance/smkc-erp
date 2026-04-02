import { FormData, ApiResponse } from '../types/formTypes'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/woman-child-walfare'

/**
 * Register a disabled person
 */
export async function registerDisabledPerson(formData: FormData): Promise<ApiResponse> {
  try {
    // Create FormData for file uploads
    const submitData = new globalThis.FormData()
    
    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        submitData.append(key, value)
      } else if (Array.isArray(value)) {
        submitData.append(key, JSON.stringify(value))
      } else if (value !== null && value !== undefined) {
        submitData.append(key, String(value))
      }
    })

    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: submitData,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Get registration by ID
 */
export async function getRegistration(id: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/register/${id}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Get all registrations
 */
export async function getAllRegistrations(
  page: number = 1, 
  limit: number = 10
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/register?page=${page}&limit=${limit}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Update registration
 */
export async function updateRegistration(
  id: string, 
  formData: Partial<FormData>
): Promise<ApiResponse> {
  try {
    const submitData = new globalThis.FormData()
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        submitData.append(key, value)
      } else if (Array.isArray(value)) {
        submitData.append(key, JSON.stringify(value))
      } else if (value !== null && value !== undefined) {
        submitData.append(key, String(value))
      }
    })

    const response = await fetch(`${API_BASE_URL}/register/${id}`, {
      method: 'PUT',
      body: submitData,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Delete registration
 */
export async function deleteRegistration(id: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/register/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Search registrations
 */
export async function searchRegistrations(
  query: string,
  field: string = 'all'
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/register/search?q=${encodeURIComponent(query)}&field=${field}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

