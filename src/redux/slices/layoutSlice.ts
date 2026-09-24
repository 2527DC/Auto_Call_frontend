import { LayoutState } from '@/types/hooks'
import { isBrowser } from '@/utils/environment'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState: LayoutState = {
  isSidebarCollapsed: false,
}

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    initializeLayout: (state) => {
      if (isBrowser) {
        state.isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed
      if (isBrowser) {
        localStorage.setItem('sidebarCollapsed', String(state.isSidebarCollapsed))
      }
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload
      if (isBrowser) {
        localStorage.setItem('sidebarCollapsed', String(state.isSidebarCollapsed))
      }
    },
  },
})

export const { toggleSidebar, setSidebarCollapsed, initializeLayout } =
  layoutSlice.actions

export default layoutSlice.reducer
