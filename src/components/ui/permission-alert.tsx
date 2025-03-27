"use client"

import { AlertCircle } from "lucide-react"

interface PermissionAlertProps {
  error: string
}

export function PermissionAlert({ error }: PermissionAlertProps) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            {error}
          </p>
        </div>
      </div>
    </div>
  )
} 