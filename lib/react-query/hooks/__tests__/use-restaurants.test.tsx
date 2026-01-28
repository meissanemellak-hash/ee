import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRestaurants, useCreateRestaurant, type RestaurantsResponse } from '../use-restaurants'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useOrganization: vi.fn(() => ({ organization: { id: 'org_test_123' } })),
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useRestaurants', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches restaurants when organization is set', async () => {
    const mockResponse: RestaurantsResponse = {
      restaurants: [
        {
          id: 'r1',
          name: 'Restaurant Test',
          address: '123 Rue Test',
          timezone: 'Europe/Paris',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useRestaurants(1, 50), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.data?.restaurants).toHaveLength(1)
    expect(result.current.data?.restaurants?.[0].name).toBe('Restaurant Test')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/restaurants?')
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('clerkOrgId=org_test_123')
    )
  })

  it('returns empty data when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useRestaurants(1, 50), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

describe('useCreateRestaurant', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls POST /api/restaurants with correct payload', async () => {
    const created = {
      id: 'r_new',
      name: 'Nouveau Restaurant',
      address: '456 Avenue',
      timezone: 'Europe/Paris',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateRestaurant(), { wrapper })

    result.current.mutate({
      name: 'Nouveau Restaurant',
      address: '456 Avenue',
      timezone: 'Europe/Paris',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nouveau Restaurant',
        address: '456 Avenue',
        timezone: 'Europe/Paris',
        clerkOrgId: 'org_test_123',
      }),
    })
    expect(result.current.data).toEqual(created)
  })
})
