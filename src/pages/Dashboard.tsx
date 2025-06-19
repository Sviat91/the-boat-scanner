
import { Clock, Trash2, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import HistoryCard, { Match } from '@/components/HistoryCard'
import ThemeToggle from '@/components/ThemeToggle'

const Dashboard = () => {
  const { user } = useAuth()
  const { history, loading, clearHistory, deleteHistoryItem } = useSearchHistory()

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white dark:text-slate-200 mb-2">
            Dashboard
          </h1>
          <p className="text-blue-100 dark:text-slate-300">
            Your profile and search history
          </p>
        </div>

        {/* Profile Card */}
        <Card className="max-w-2xl mx-auto mb-8 p-6 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
              <AvatarFallback className="bg-blue-500 text-white text-xl">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Signed in with Google
              </div>
            </div>
          </div>
        </Card>

        {/* Search History */}
        <Card className="max-w-4xl mx-auto bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="search-history" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <Search className="w-6 h-6" />
                  Search History ({history.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No search history yet</p>
                    <p className="text-sm">Your searches will appear here after you perform them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {history.length} search{history.length !== 1 ? 'es' : ''}
                      </p>
                      <Button
                        onClick={clearHistory}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    
                    {history.map((item) => (
                      <Card key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex gap-4">
                          {/* User uploaded image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700">
                              <img 
                                src={item.user_image_url || '/placeholder.svg'} 
                                alt="Your upload"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Your photo</p>
                          </div>
                          
                          {/* Arrow */}
                          <div className="flex items-center text-blue-400 dark:text-blue-300">
                            <div className="w-6 h-0.5 bg-blue-400 dark:bg-blue-300"></div>
                            <div className="w-0 h-0 border-l-3 border-l-blue-400 dark:border-l-blue-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                          </div>
                          
                          {/* Result content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-800 dark:text-gray-200">Search Result</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(item.created_at)}
                                </span>
                                <Button
                                  onClick={() => deleteHistoryItem(item.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {Array.isArray(item.search_results) ? (
                                item.search_results.map((result: Match, idx: number) => (
                                  <div key={idx} className="border-b dark:border-gray-600 last:border-b-0 pb-2 last:pb-0">
                                    <HistoryCard {...result} />
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.search_results?.not_boat || 'No results found'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
