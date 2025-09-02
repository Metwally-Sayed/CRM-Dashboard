'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Palette,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

interface SystemSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  timezone: string
  currency: string
  language: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  twoFactorEnabled: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  requirePasswordComplexity: boolean
  dataRetentionDays: number
  backupFrequency: string
  logLevel: string
  enableAnalytics: boolean
  enableNotifications: boolean
  defaultUserRole: string
  maxFileUploadSize: number
  allowedFileTypes: string[]
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpSecure: boolean
}

interface UserPreferences {
  theme: string
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  weeklyReports: boolean
  orderUpdates: boolean
  securityAlerts: boolean
  dashboardLayout: string
  itemsPerPage: number
}

const defaultSystemSettings: SystemSettings = {
  siteName: 'CRM System',
  siteDescription: 'Customer Relationship Management System',
  contactEmail: 'contact@crmsystem.com',
  supportEmail: 'support@crmsystem.com',
  timezone: 'UTC',
  currency: 'USD',
  language: 'en',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  twoFactorEnabled: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requirePasswordComplexity: true,
  dataRetentionDays: 365,
  backupFrequency: 'daily',
  logLevel: 'info',
  enableAnalytics: true,
  enableNotifications: true,
  defaultUserRole: 'USER',
  maxFileUploadSize: 10,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpSecure: true
}

const defaultUserPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  weeklyReports: true,
  orderUpdates: true,
  securityAlerts: true,
  dashboardLayout: 'grid',
  itemsPerPage: 10
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(defaultUserPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isManager = session?.user?.role === 'MANAGER'
  const canManageSystem = isAdmin

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch system settings (admin only)
      if (canManageSystem) {
        const systemResponse = await fetch('/api/settings/system')
        if (systemResponse.ok) {
          const systemData = await systemResponse.json()
          setSystemSettings({ ...defaultSystemSettings, ...systemData })
        }
      }
      
      // Fetch user preferences
      const userResponse = await fetch('/api/settings/user')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserPreferences({ ...defaultUserPreferences, ...userData })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    if (!canManageSystem) return
    
    try {
      setSaving(true)
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save system settings')
      }
      
      toast({
        title: 'Success',
        description: 'System settings saved successfully'
      })
    } catch (error) {
      console.error('Error saving system settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save system settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const saveUserPreferences = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPreferences)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save user preferences')
      }
      
      toast({
        title: 'Success',
        description: 'Preferences saved successfully'
      })
    } catch (error) {
      console.error('Error saving user preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testEmailConfiguration = async () => {
    if (!canManageSystem) return
    
    try {
      setTestingEmail(true)
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: session?.user?.email,
          subject: 'Test Email Configuration',
          message: 'This is a test email to verify SMTP configuration.'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send test email')
      }
      
      toast({
        title: 'Success',
        description: 'Test email sent successfully'
      })
    } catch (error) {
      console.error('Error testing email:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setTestingEmail(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage system configuration and preferences
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and preferences
          </p>
        </div>
        <Badge variant={canManageSystem ? 'default' : 'secondary'}>
          {session?.user?.role}
        </Badge>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          {canManageSystem && (
            <>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* User Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Display
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={userPreferences.theme}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={userPreferences.language}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={userPreferences.timezone}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemsPerPage">Items per page</Label>
                  <Select
                    value={userPreferences.itemsPerPage.toString()}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, itemsPerPage: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveUserPreferences} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.emailNotifications}
                    onCheckedChange={(checked: boolean) => setUserPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.pushNotifications}
                    onCheckedChange={(checked: boolean) => setUserPreferences(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.orderUpdates}
                    onCheckedChange={(checked: boolean) => setUserPreferences(prev => ({ ...prev, orderUpdates: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance reports
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.weeklyReports}
                    onCheckedChange={(checked: boolean) => setUserPreferences(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important security notifications
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.securityAlerts}
                    onCheckedChange={(checked: boolean) => setUserPreferences(prev => ({ ...prev, securityAlerts: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Promotional content and product updates
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.marketingEmails}
                    onCheckedChange={(checked: boolean) => setUserPreferences(prev => ({ ...prev, marketingEmails: checked }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveUserPreferences} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings (Admin Only) */}
        {canManageSystem && (
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={systemSettings.contactEmail}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={systemSettings.currency}
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select
                      value={systemSettings.timezone}
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable access to the system
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked: boolean) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked: boolean) => setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveSystemSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Email Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  SMTP settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={systemSettings.smtpHost}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={systemSettings.smtpPort}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={systemSettings.smtpUsername}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={systemSettings.smtpPassword}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable secure connection to SMTP server
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.smtpSecure}
                    onCheckedChange={(checked: boolean) => setSystemSettings(prev => ({ ...prev, smtpSecure: checked }))}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={testEmailConfiguration}
                    disabled={testingEmail || !systemSettings.smtpHost}
                  >
                    {testingEmail ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Test Email
                  </Button>
                  
                  <Button onClick={saveSystemSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Settings (Admin Only) */}
        {canManageSystem && (
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Authentication and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={systemSettings.maxLoginAttempts}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={systemSettings.passwordMinLength}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultUserRole">Default User Role</Label>
                    <Select
                      value={systemSettings.defaultUserRole}
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, defaultUserRole: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Verification Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.emailVerificationRequired}
                      onCheckedChange={(checked: boolean) => setSystemSettings(prev => ({ ...prev, emailVerificationRequired: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Password Complexity</Label>
                      <p className="text-sm text-muted-foreground">
                        Require uppercase, lowercase, numbers, and symbols
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.requirePasswordComplexity}
                      onCheckedChange={(checked: boolean) => setSystemSettings(prev => ({ ...prev, requirePasswordComplexity: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable 2FA for enhanced security
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.twoFactorEnabled}
                      onCheckedChange={(checked: boolean) => setSystemSettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveSystemSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Data & Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Data retention and backup settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                    <Input
                      id="dataRetentionDays"
                      type="number"
                      min="30"
                      max="3650"
                      value={systemSettings.dataRetentionDays}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) || 365 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={systemSettings.backupFrequency}
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
                    <Input
                      id="maxFileUploadSize"
                      type="number"
                      min="1"
                      max="100"
                      value={systemSettings.maxFileUploadSize}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileUploadSize: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select
                      value={systemSettings.logLevel}
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, logLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveSystemSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}