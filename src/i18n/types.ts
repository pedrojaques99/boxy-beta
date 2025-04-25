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
    search: {
      placeholder: string
      noResults: string
    }
    filters: {
      all: string
      category: string
      textures: string
      models: string
      materials: string
      hdris: string
      plugins: string
      software: string
      type: string
    }
  }
  navigation: {
    about: string
    shop: string
    labs: string
    pricing: string
    switchToEnglish: string
    switchToPortuguese: string
    toggleTheme: string
    myAccount: string
    signOut: string
    signIn: string
    getStarted: string
  }
  home: {
    hero: {
      title: string
      subtitle: string
    }
    features: {
      title: string
      subtitle: string
      items: {
        premium: {
          title: string
          description: string
        }
        exclusive: {
          title: string
          description: string
        }
        community: {
          title: string
          description: string
        }
      }
    }
    latestProducts: {
      title: string
      viewAll: string
    }
    categories: {
      title: string
      subtitle: string
      discover: string
    }
    about: {
      title: string
      description: string
      teamMember: string
    }
    faq: {
      title: string
      items: {
        howItWorks: {
          question: string
          answer: string
        }
        paymentMethods: {
          question: string
          answer: string
        }
        subscription: {
          question: string
          answer: string
        }
      }
    }
    roadmap: {
      title: string
      items: {
        q1: {
          quarter: string
          title: string
          description: string
        }
        q2: {
          quarter: string
          title: string
          description: string
        }
        q3: {
          quarter: string
          title: string
          description: string
        }
      }
    }
    community: {
      title: string
      description: string
      joinDiscord: string
    }
  }
  footer: {
    brand: {
      title: string
      description: string
    }
    products: {
      title: string
      explore: string
      pricing: string
    }
    resources: {
      title: string
      blog: string
      community: string
    }
    legal: {
      title: string
      privacy: string
      terms: string
    }
    copyright: string
  }
} 