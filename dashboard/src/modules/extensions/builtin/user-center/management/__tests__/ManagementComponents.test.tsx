import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import OverviewCards from '../components/OverviewCards'
import TrendChart from '../components/TrendChart'
import PermissionMatrixEditor from '../components/PermissionMatrixEditor'
import UserGroupManagement from '../components/UserGroupManagement'

describe('Management dashboard components', () => {
  it('renders loading state for overview cards', () => {
    const { container } = render(<OverviewCards isLoading />)
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('supports switching trend granularity', () => {
    const series = {
      daily: [
        { period: '2025-03-01', total: 120, active: 80, subscribed: 40 },
        { period: '2025-03-02', total: 140, active: 90, subscribed: 50 },
      ],
      weekly: [
        { period: '2025-W09', total: 900, active: 600, subscribed: 320 },
      ],
    }

    render(<TrendChart series={series} />)

    expect(screen.getByText('2025-03-01')).toBeInTheDocument()

    const weeklyButton = screen.getByRole('button', { name: '按周' })
    fireEvent.click(weeklyButton)

    expect(screen.getByText('2025-W09')).toBeInTheDocument()
  })

  it('disables permission matrix editing when read only', () => {
    const matrix = {
      registration: { admin: true, operator: false, user: false },
    }

    render(
      <PermissionMatrixEditor
        matrix={matrix}
        roles={['admin', 'operator', 'user']}
        canEdit={false}
      />,
    )

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeDisabled()
    }
    expect(screen.queryByRole('button', { name: /保存/ })).not.toBeInTheDocument()
  })

  it('flags pending role updates in user group management', () => {
    const handleRoleChange = vi.fn()
    const users = [
      { id: '1', email: 'admin@example.com', role: 'admin', active: true },
      { id: '2', email: 'operator@example.com', role: 'operator', active: false },
    ]

    render(
      <UserGroupManagement
        users={users}
        canEditRoles
        pendingUserIds={new Set(['1'])}
        onRoleChange={handleRoleChange}
      />,
    )

    const pendingSelect = screen.getAllByRole('combobox')[0]
    expect(pendingSelect).toBeDisabled()
    expect(screen.getByText('更新中…')).toBeInTheDocument()

    const editableSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(editableSelect, { target: { value: 'admin' } })
    expect(handleRoleChange).toHaveBeenCalledWith('2', 'admin')
  })
})
