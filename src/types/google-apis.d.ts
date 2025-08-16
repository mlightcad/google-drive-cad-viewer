declare global {
  interface Window {
    gapi: any
    google: any
  }
  
  // Declare global variables for Google APIs
  const gapi: any
  const google: any
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(): void
      }
      
      function initTokenClient(config: {
        client_id: string
        scope: string
        callback: (response: any) => void
      }): TokenClient
      
      function revoke(token: string): void
    }
  }
}

declare namespace gapi {
  namespace client {
    function init(config: {
      apiKey: string
      discoveryDocs: string[]
    }): Promise<void>
    
    function request(request: {
      path: string
    }): Promise<any>
    
    function getToken(): { access_token: string } | null
    
    function setToken(token: string | null): void
    
    namespace drive {
      namespace files {
        function list(params: {
          q?: string
          pageSize?: number
          pageToken?: string
          fields?: string
        }): Promise<{
          result: {
            files?: Array<{
              id: string
              name: string
              size: string
              modifiedTime: string
              mimeType: string
            }>
            nextPageToken?: string
          }
        }>
        
        function get(params: {
          fileId: string
          alt?: string
          fields?: string
        }): Promise<{
          result: {
            body?: string
            webContentLink?: string
          }
        }>
      }
    }
  }
  
  function load(api: string, callback: () => void): void
}

export {}
