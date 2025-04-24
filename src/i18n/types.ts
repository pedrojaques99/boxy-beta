export type Dictionary = {
  auth: {
    welcome: string
    signInToContinue: string
    continueWithGithub: string
    continueWithGoogle: string
    loggingIn: string
    error: {
      title: string
      description: string
      backToLogin: string
    }
  }
  protected: {
    hello: string
    logout: string
  }
  shop: {
    title: string
    viewDetails: string
    noProducts: string
    filters: {
      all: string
      category: string
      software: string
      type: string
    }
  }
} 