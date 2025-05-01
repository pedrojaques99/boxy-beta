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
  labs: {
    title: string
    description: string
    noLabs: string
    tryIt: string
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
      software: string
      type: string
      textures: string
      models: string
      materials: string
      hdris: string
      plugins: string
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
  admin: {
    loading: string
    title: string
    description: string
    auth: {
      title: string
      description: string
      password: {
        placeholder: string
      }
      submit: string
      success: string
      error: string
    }
    plans: {
      title: string
      create: string
      created: string
      error: string
    }
    products: {
      title: string
      name: string
      description: string
      type: string
      category: string
      software: string
      tags: string
      file_url: string
      add: string
      delete: string
      added: string
      deleted: string
      error: string
      thumb: {
        label: string
        uploading: string
        uploaded: string
        error: string
        alt: string
      }
    }
  }
  profile: {
    subscription: {
      title: string
      description: string
      currentPlan: string
      status: string
      nextBilling: string
      changePlan: string
      noSubscription: string
      subscribe: string
    }
  }
  checkout: {
    selectPlan: string
    paymentDetails: string
    confirm: string
    cardNumber: string
    cardName: string
    expiryDate: string
    cvv: string
    plan: string
    price: string
    back: string
    next: string
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
    pricing: {
      title: string
      subtitle: string
      plans: {
        free: {
          name: string
          price: string
          features: string[]
          button: string
        }
        annual: {
          name: string
          price: string
          monthly: string
          features: string[]
          button: string
        }
        monthly: {
          name: string
          price: string
          monthly: string
          features: string[]
          button: string
        }
      }
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