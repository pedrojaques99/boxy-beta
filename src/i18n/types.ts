import type { Locale } from './settings'

export interface MindyTranslations {
  title: string
  description: string
  noResults: string
  filters: {
    category: string
    subcategory: string
    software: string
  }
  search: {
    placeholder: string
    noResults: string
    recentSearches: string
  }
  details: {
    title: string
    description: string
    createdBy: string
    visitResource: string
    comments: string
    relatedResources: string
    seeDetails: string
    filterBy: string
    writeComment: string
    submitComment: string
  }
}

export interface ShopTranslations {
  title: string
  description: string
  viewDetails: string
  noProducts: string
  search: {
    placeholder: string
    noResults: string
    recentSearches: string
  }
  filters: {
    all: string
    category: string
    software: string
    type: string
    status: string
    textures: string
    models: string
    materials: string
    hdris: string
    plugins: string
    free: string
    premium: string
  }
}

export interface Dictionary {
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
    signUpSuccess: {
      title: string
      description: string
      continue: string
      checkEmail: string
    }
    accessDenied: {
      title: string
      description: string
      backHome: string
    }
  }
  labs: {
    title: string
    description: string
    noLabs: string
    tryIt: string
    explore: string
  }
  protected: {
    hello: string
    logout: string
  }
  shop: ShopTranslations
  navigation: {
    about: string
    shop: string
    labs: string
    mindy: string
    pricing: string
    switchToEnglish: string
    switchToPortuguese: string
    toggleTheme: string
    myAccount: string
    signOut: string
    signIn: string
    getStarted: string
  }
  mindy: MindyTranslations
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
    subscribers: {
      title: string
      description: string
      filters: {
        status: string
        search: string
      }
      table: {
        email: string
        name: string
        plan: string
        status: string
        startDate: string
        nextBilling: string
        actions: string
      }
      export: string
      noSubscribers: string
      loading: string
    }
    downloads: {
      title: string
      description: string
      filters: {
        type: string
        search: string
      }
      table: {
        resource: string
        user: string
        date: string
        type: string
      }
      stats: {
        total: string
        uniqueUsers: string
        uniqueResources: string
      }
      export: string
      noDownloads: string
      loading: string
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
      cardAndPlan: string
      cardDetails: string
      expires: string
      noCard: string
      updateCard: string
      cancelTitle: string
      cancelDescription: string
      cancelButton: string
      cancelConfirmTitle: string
      cancelConfirmDescription: string
      cancelYes: string
      cancelNo: string
      cancelSuccess: string
      error: {
        fetchingCard: string
        cancelling: string
      }
    }
    profileInfo: string
    accountSettings: string
    bio: string
    noBio: string
    memberSince: string
    upgradeToPremium: string
    editProfile: string
    paymentSettings: string
    notificationPreferences: string
    manageSubscription: string
    clickToChange: string
    tryAgain: string
    loading: {
      profileInfo: string
      accountSettings: string
    }
    recentDownloads: string
    noDownloads: string
    likedResources: {
      title: string
      description: string
      noLikes: string
      loading: string
      filters: {
        category: string
        search: string
      }
      table: {
        resource: string
        category: string
        addedAt: string
        actions: string
      }
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

export type TranslationResponse = {
  [key in Locale]: Dictionary
} 