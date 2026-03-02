import { Outlet, Link, useLocation } from 'react-router'
import { useAuth } from '@/providers/AuthProvider'
import { ROUTES } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  FileText,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Job Offers', href: ROUTES.JOB_OFFERS, icon: Briefcase },
  { label: 'Candidates', href: ROUTES.CANDIDATES, icon: Users },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const getPageTitle = (): string => {
    if (location.pathname === ROUTES.DASHBOARD) return 'Dashboard'
    if (location.pathname === ROUTES.JOB_OFFERS) return 'Job Offers'
    if (location.pathname.startsWith('/job-offers/')) return 'Job Offer Details'
    if (location.pathname === ROUTES.CANDIDATES) return 'Candidates'
    if (location.pathname.startsWith('/candidates/')) return 'Candidate Profile'
    if (location.pathname.startsWith('/scorings/')) return 'Scoring Details'
    return 'Dashboard'
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">CV Scoring</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== ROUTES.DASHBOARD && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          <Separator className="my-4" />

          <Link
            to="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>

        {/* User section */}
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 h-auto py-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium truncate">{user?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 shrink-0">
          <h1 className="font-semibold text-xl">{getPageTitle()}</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
