import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "moon": z.object({
        "phase": z.string(),
        "illumination": z.number()
      }),
      "moonBar": z.object({
        "label": z.string()
      }),
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "ctaPrimary": z.string(),
        "ctaSecondary": z.string()
      }),
      "features": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "title": z.string(),
          "desc": z.string(),
          "href": z.string(),
          "glyph": z.string()
        }))
      }),
      "todaySection": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "description": z.string(),
        "body": z.string(),
        "cta": z.string()
      }),
      "memberSection": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "body": z.string(),
        "cta": z.string(),
        "ctaSecondary": z.string()
      }),
      "communityBanner": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "cta": z.string(),
        "ctaSecondary": z.string(),
        "body": z.string()
      }),
      "exploreSection": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "body": z.string()
      }),
      "resources": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "href": z.string(),
          "image": z.string(),
          "title": z.string(),
          "category": z.string(),
          "desc": z.string(),
          "buttonLabel": z.string()
        }))
      })
    }),
    resources: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "tarot": z.object({
        "sectionTitle": z.string(),
        "intro": z.string(),
        "suits": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "element": z.string(),
          "theme": z.string(),
          "description": z.string(),
          "keywords": z.string()
        })),
        "courtCards": z.object({
          "title": z.string(),
          "description": z.string()
        })
      }),
      "spreads": z.object({
        "sectionTitle": z.string(),
        "intro": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "positions": z.string(),
          "purpose": z.string(),
          "description": z.string()
        }))
      }),
      "numerology": z.object({
        "sectionTitle": z.string(),
        "intro": z.string(),
        "personalYear": z.object({
          "title": z.string(),
          "intro": z.string(),
          "howTo": z.string(),
          "years": z.array(z.object({
            "id": z.string(),
            "number": z.string(),
            "theme": z.string(),
            "description": z.string()
          }))
        }),
        "lifeLesson": z.object({
          "title": z.string(),
          "intro": z.string(),
          "howTo": z.string(),
          "numbers": z.array(z.object({
            "id": z.string(),
            "number": z.string(),
            "lesson": z.string(),
            "description": z.string()
          }))
        })
      }),
      "angelNumbers": z.object({
        "sectionTitle": z.string(),
        "intro": z.string(),
        "numbers": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "meaning": z.string(),
          "keywords": z.string()
        }))
      }),
      "closing": z.object({
        "title": z.string(),
        "text": z.string()
      })
    }),
    blog: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "featured": z.object({
        "tag": z.string(),
        "category": z.string(),
        "title": z.string(),
        "excerpt": z.string(),
        "author": z.string(),
        "date": z.string(),
        "readTime": z.string()
      }),
      "posts": z.array(z.object({
        "id": z.string(),
        "category": z.string(),
        "title": z.string(),
        "excerpt": z.string(),
        "author": z.string(),
        "date": z.string(),
        "readTime": z.string(),
        "tag": z.string()
      })),
      "categories": z.array(z.object({
        "id": z.string(),
        "name": z.string()
      })),
      "newsletter": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "placeholder": z.string(),
        "button": z.string()
      })
    }),
    community: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "ctaLabel": z.string(),
        "searchPlaceholder": z.string()
      }),
      "categorySection": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "allLabel": z.string(),
        "revealLabel": z.string(),
        "collapseLabel": z.string()
      }),
      "emptyStates": z.object({
        "following": z.string(),
        "mine": z.string(),
        "default": z.string(),
        "ctaLabel": z.string()
      }),
      "sidebar": z.object({
        "trendingTitle": z.string(),
        "trendingEmpty": z.string(),
        "quickLinksTitle": z.string()
      })
    }),
    moon_calendar: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "footer": z.object({
        "note": z.string()
      }),
      "whispers": z.object({
        "New Moon": z.string(),
        "Waxing Crescent": z.string(),
        "First Quarter": z.string(),
        "Waxing Gibbous": z.string(),
        "Full Moon": z.string(),
        "Waning Gibbous": z.string(),
        "Last Quarter": z.string(),
        "Waning Crescent": z.string()
      })
    }),
    about: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "intro": z.object({
        "heading": z.string(),
        "body": z.string(),
        "cta": z.string(),
        "ctaRoute": z.string()
      }),
      "mission": z.object({
        "heading": z.string(),
        "body": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }),
      "howItWorks": z.object({
        "heading": z.string(),
        "intro": z.string(),
        "tools": z.array(z.object({
          "id": z.string(),
          "title": z.string(),
          "icon": z.string(),
          "what": z.string(),
          "how": z.string(),
          "means": z.string(),
          "limits": z.string(),
          "route": z.string(),
          "cta": z.string()
        }))
      }),
      "sources": z.object({
        "heading": z.string(),
        "intro": z.string(),
        "types": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "description": z.string()
        })),
        "disclaimer": z.string()
      }),
      "privacy": z.object({
        "heading": z.string(),
        "noAccountTools": z.string(),
        "accountTools": z.string(),
        "dataNote": z.string(),
        "journalNote": z.string(),
        "body": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        })),
        "links": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "route": z.string()
        }))
      }),
      "faq": z.object({
        "heading": z.string(),
        "groups": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "items": z.array(z.object({
            "id": z.string(),
            "question": z.string(),
            "answer": z.string()
          }))
        }))
      }),
      "mobile": z.object({
        "heading": z.string(),
        "description": z.string(),
        "platforms": z.array(z.object({
          "id": z.string(),
          "platform": z.string(),
          "label": z.string(),
          "status": z.string()
        }))
      }),
      "closing": z.object({
        "heading": z.string(),
        "body": z.string(),
        "links": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "route": z.string()
        }))
      }),
      "TOC_ITEMS": z.array(z.object({
        "id": z.string(),
        "label": z.string()
      }))
    }),
    herbs: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      })
    }),
    birth_chart: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "form": z.object({
        "title": z.string(),
        "subtitle": z.string()
      })
    }),
    grimoire: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "stats": z.object({
        "entriesLabel": z.string(),
        "entryLabel": z.string(),
        "favoritesLabel": z.string()
      }),
      "toolbar": z.object({
        "searchPlaceholder": z.string(),
        "favoritesButton": z.string(),
        "newEntryButton": z.string()
      }),
      "filterAll": z.string(),
      "emptyState": z.object({
        "title": z.string(),
        "description": z.string(),
        "cta": z.string()
      }),
      "form": z.object({
        "newTitle": z.string(),
        "editTitle": z.string(),
        "typeLabel": z.string(),
        "titleLabel": z.string(),
        "titlePlaceholder": z.string(),
        "contentLabel": z.string(),
        "contentPlaceholder": z.string(),
        "notesLabel": z.string(),
        "notesOptional": z.string(),
        "notesPlaceholder": z.string(),
        "tagsLabel": z.string(),
        "tagsOptional": z.string(),
        "tagsPlaceholder": z.string(),
        "moonPhaseLabel": z.string(),
        "moonPhasePlaceholder": z.string(),
        "favoriteLabel": z.string(),
        "cancelButton": z.string(),
        "saveButton": z.string(),
        "addButton": z.string(),
        "savingText": z.string(),
        "errorRequired": z.string(),
        "errorSave": z.string()
      }),
      "deleteDialog": z.object({
        "title": z.string(),
        "description": z.string(),
        "cancelButton": z.string(),
        "deleteButton": z.string()
      })
    }),
    tarot: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "spreadSection": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "drawSection": z.object({
        "shufflePrompt": z.string(),
        "shuffleButton": z.string(),
        "shufflingText": z.string(),
        "drawButton": z.string(),
        "drawingText": z.string(),
        "intentionLabel": z.string(),
        "intentionPlaceholder": z.string(),
        "newReadingButton": z.string(),
        "saveButton": z.string(),
        "savingText": z.string(),
        "savedText": z.string(),
        "loginToSave": z.string()
      }),
      "cardDetail": z.object({
        "uprightLabel": z.string(),
        "reversedLabel": z.string(),
        "keywordsLabel": z.string(),
        "elementLabel": z.string(),
        "planetLabel": z.string(),
        "zodiacLabel": z.string()
      }),
      "historySection": z.object({
        "heading": z.string(),
        "emptyText": z.string(),
        "deleteButton": z.string(),
        "spreadLabel": z.string(),
        "intentionLabel": z.string(),
        "cardsLabel": z.string()
      }),
      "seo": z.object({
        "title": z.string(),
        "description": z.string()
      })
    }),
    moon_ritual: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "phaseSection": z.object({
        "heading": z.string(),
        "ageLabel": z.string(),
        "illuminationLabel": z.string()
      }),
      "intentionSection": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "ritualSection": z.object({
        "heading": z.string(),
        "herbsLabel": z.string(),
        "crystalsLabel": z.string(),
        "candleLabel": z.string(),
        "bestTimeLabel": z.string(),
        "stepsLabel": z.string(),
        "affirmationsLabel": z.string(),
        "journalLabel": z.string(),
        "saveButton": z.string(),
        "savingText": z.string(),
        "savedText": z.string(),
        "scheduleButton": z.string(),
        "loginToSave": z.string()
      }),
      "historySection": z.object({
        "heading": z.string(),
        "emptyText": z.string(),
        "scheduledLabel": z.string(),
        "deleteButton": z.string()
      }),
      "seo": z.object({
        "title": z.string(),
        "description": z.string()
      })
    }),
    dashboard: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "moonWidget": z.object({
        "heading": z.string(),
        "ageLabel": z.string(),
        "illuminationLabel": z.string(),
        "energyLabel": z.string()
      }),
      "cardWidget": z.object({
        "heading": z.string(),
        "reversedLabel": z.string(),
        "uprightLabel": z.string(),
        "keywordsLabel": z.string()
      }),
      "affirmationWidget": z.object({
        "heading": z.string(),
        "copyLabel": z.string()
      }),
      "herbWidget": z.object({
        "heading": z.string(),
        "elementLabel": z.string(),
        "planetLabel": z.string(),
        "usesLabel": z.string(),
        "tipLabel": z.string()
      }),
      "crystalWidget": z.object({
        "heading": z.string(),
        "elementLabel": z.string(),
        "chakraLabel": z.string(),
        "usesLabel": z.string(),
        "tipLabel": z.string()
      }),
      "journalWidget": z.object({
        "heading": z.string(),
        "openLabel": z.string()
      }),
      "spellWidget": z.object({
        "heading": z.string(),
        "typeLabel": z.string(),
        "durationLabel": z.string(),
        "materialsLabel": z.string(),
        "descriptionLabel": z.string()
      }),
      "eventsWidget": z.object({
        "heading": z.string(),
        "viewAllLabel": z.string(),
        "daysLabel": z.string()
      }),
      "grimoireWidget": z.object({
        "heading": z.string(),
        "viewAllLabel": z.string(),
        "emptyText": z.string(),
        "signInText": z.string()
      }),
      "seo": z.object({
        "title": z.string(),
        "description": z.string()
      })
    }),
    timeline: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "empty": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "cta": z.string()
      }),
      "onThisDay": z.object({
        "heading": z.string()
      }),
      "form": z.object({
        "addTitle": z.string(),
        "editTitle": z.string(),
        "titlePlaceholder": z.string(),
        "contentPlaceholder": z.string(),
        "tagsPlaceholder": z.string(),
        "saveButton": z.string(),
        "updateButton": z.string()
      })
    }),
    calendar: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "dailyWeather": z.object({
        "heading": z.string(),
        "moonLabel": z.string(),
        "affirmationLabel": z.string(),
        "tarotLabel": z.string(),
        "journalLabel": z.string()
      }),
      "legend": z.object({
        "heading": z.string()
      }),
      "noEvents": z.string(),
      "personalLabel": z.string(),
      "addPersonalCta": z.string()
    }),
    dream_journal: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "tabs": z.object({
        "journal": z.string(),
        "symbols": z.string(),
        "shadowWork": z.string()
      }),
      "empty": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "cta": z.string()
      }),
      "symbolLibrary": z.object({
        "heading": z.string(),
        "disclaimer": z.string()
      }),
      "shadowWork": z.object({
        "heading": z.string(),
        "intro": z.string(),
        "disclaimer": z.string()
      }),
      "form": z.object({
        "addTitle": z.string(),
        "editTitle": z.string(),
        "titlePlaceholder": z.string(),
        "contentPlaceholder": z.string(),
        "symbolsPlaceholder": z.string(),
        "feelingsPlaceholder": z.string(),
        "saveButton": z.string()
      })
    }),
    sanctuary: z.object({
      "greeting": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "moonSubtitle": z.string()
      }),
      "continueSection": z.string(),
      "sanctuarySection": z.string(),
      "favoritesSection": z.string(),
      "recentSection": z.string(),
      "recentGrimoire": z.string(),
      "recentTarot": z.string(),
      "recentTimeline": z.string(),
      "recentConnections": z.string(),
      "dashboardCta": z.string(),
      "dashboardButton": z.string(),
      "guest": z.object({
        "title": z.string(),
        "description": z.string(),
        "signIn": z.string(),
        "createAccount": z.string(),
        "browseNote": z.string(),
        "browseLink": z.string()
      }),
      "empty": z.object({
        "grimoire": z.string(),
        "grimoireCta": z.string(),
        "tarot": z.string(),
        "tarotCta": z.string(),
        "ritual": z.string(),
        "ritualCta": z.string(),
        "timeline": z.string(),
        "timelineCta": z.string()
      })
    }),
    spells: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "description": z.string()
      }),
      "submitCta": z.string(),
      "searchPlaceholder": z.string(),
      "noResults": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "disclaimer": z.string(),
      "intentionChooser": z.object({
        "heading": z.string(),
        "subtitle": z.string(),
        "intentions": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "value": z.string(),
          "glyph": z.string(),
          "description": z.string()
        }))
      }),
      "featuredSpell": z.object({
        "heading": z.string(),
        "ctaLabel": z.string()
      })
    }),
    spell_detail: z.object({
      "breadcrumb": z.string(),
      "featuredLabel": z.string(),
      "purposeHeading": z.string(),
      "materialsHeading": z.string(),
      "stepsHeading": z.string(),
      "safetyHeading": z.string(),
      "reviewsHeading": z.string(),
      "ratingsDisclaimer": z.string(),
      "writeReviewHeading": z.string(),
      "writeReviewNote": z.string(),
      "submitReviewCta": z.string(),
      "alreadyReviewed": z.string(),
      "signInToReview": z.string(),
      "noReviews": z.string(),
      "saveCta": z.string(),
      "savedCta": z.string(),
      "signInToSave": z.string(),
      "correspondencesHeading": z.string(),
      "relatedHeading": z.string(),
      "notFoundTitle": z.string()
    }),
    spell_submit: z.object({
      "title": z.string(),
      "description": z.string(),
      "breadcrumb": z.string(),
      "signInPrompt": z.string(),
      "signInCta": z.string(),
      "successTitle": z.string(),
      "successDescription": z.string(),
      "browseCta": z.string(),
      "submitAnotherCta": z.string(),
      "basicInfoHeading": z.string(),
      "materialsHeading": z.string(),
      "stepsHeading": z.string(),
      "correspondencesHeading": z.string(),
      "submitCta": z.string(),
      "submittingLabel": z.string()
    }),
    admin_spells: z.object({
      "title": z.string(),
      "description": z.string(),
      "noSpells": z.string(),
      "noReports": z.string(),
      "featuredLabel": z.string(),
      "memberSubmissionLabel": z.string(),
      "approveCta": z.string(),
      "rejectCta": z.string(),
      "reapproveCta": z.string(),
      "removeCta": z.string(),
      "featureCta": z.string(),
      "unfeatureCta": z.string()
    }),
    messages: z.object({
      "title": z.string(),
      "subtitle": z.string(),
      "emptyConversations": z.string(),
      "emptyConversationsHint": z.string(),
      "emptyThread": z.string(),
      "emptyThreadHint": z.string(),
      "emptyMessages": z.string(),
      "signInPrompt": z.string(),
      "signInButton": z.string(),
      "noKeyWarning": z.string(),
      "encryptedLabel": z.string(),
      "encryptedShort": z.string(),
      "conversationsLabel": z.string(),
      "decryptingLabel": z.string(),
      "messagePlaceholder": z.string()
    }),
    community_landing: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "gatherings": z.array(z.object({
        "id": z.string(),
        "type": z.string(),
        "title": z.string(),
        "date": z.string(),
        "time": z.string(),
        "description": z.string()
      })),
      "testimonials": z.array(z.object({
        "id": z.string(),
        "quote": z.string(),
        "author": z.string(),
        "name": z.string(),
        "role": z.string()
      }))
    }),
    community_category: z.object({
      "backLabel": z.string(),
      "newDiscussionLabel": z.string(),
      "startFirstLabel": z.string(),
      "emptyText": z.string(),
      "filters": z.object({
        "latest": z.string(),
        "popular": z.string(),
        "unanswered": z.string()
      })
    }),
    community_post: z.object({
      "backLabel": z.string(),
      "notFoundText": z.string(),
      "backToCommunityLabel": z.string(),
      "noRepliesText": z.string(),
      "postReplyLabel": z.string(),
      "postingLabel": z.string(),
      "replyPlaceholder": z.string(),
      "lockedText": z.string(),
      "shareLabel": z.string(),
      "copiedLabel": z.string(),
      "saveLabel": z.string(),
      "savedLabel": z.string(),
      "reportLabel": z.string(),
      "acceptAnswerLabel": z.string(),
      "acceptedAnswerLabel": z.string(),
      "sortOldest": z.string(),
      "sortTop": z.string()
    }),
    community_new: z.object({
      "pageTitle": z.string(),
      "pageSubtitle": z.string(),
      "backLabel": z.string(),
      "typeSection": z.object({
        "label": z.string(),
        "discussion": z.string(),
        "discussionDesc": z.string(),
        "question": z.string(),
        "questionDesc": z.string()
      }),
      "categoryLabel": z.string(),
      "categoryPlaceholder": z.string(),
      "titleLabel": z.string(),
      "titlePlaceholder": z.string(),
      "bodyLabel": z.string(),
      "bodyPlaceholder": z.string(),
      "tagsLabel": z.string(),
      "tagsPlaceholder": z.string(),
      "tagsHint": z.string(),
      "imageSection": z.object({
        "label": z.string(),
        "placeholder": z.string(),
        "hint": z.string()
      }),
      "pollSection": z.object({
        "toggleLabel": z.string(),
        "questionLabel": z.string(),
        "questionPlaceholder": z.string(),
        "choicesLabel": z.string(),
        "choicePlaceholder": z.string(),
        "addChoiceLabel": z.string(),
        "removeChoiceLabel": z.string(),
        "closeDateLabel": z.string(),
        "minChoicesHint": z.string()
      }),
      "previewSection": z.object({
        "toggleLabel": z.string(),
        "editLabel": z.string()
      }),
      "submitLabel": z.string(),
      "submittingLabel": z.string(),
      "cancelLabel": z.string(),
      "errors": z.object({
        "categoryRequired": z.string(),
        "titleRequired": z.string(),
        "titleTooShort": z.string(),
        "bodyRequired": z.string(),
        "bodyTooShort": z.string(),
        "pollQuestion": z.string(),
        "pollChoices": z.string(),
        "generic": z.string()
      })
    }),
    community_bookmarks: z.object({
      "pageTitle": z.string(),
      "pageSubtitle": z.string(),
      "backLabel": z.string(),
      "emptyTitle": z.string(),
      "emptyText": z.string(),
      "browseCta": z.string(),
      "removeLabel": z.string(),
      "categoryLabel": z.string(),
      "savedLabel": z.string(),
      "solvedLabel": z.string()
    }),
    community_notifications: z.object({
      "pageTitle": z.string(),
      "backLabel": z.string(),
      "markAllRead": z.string(),
      "emptyTitle": z.string(),
      "emptyText": z.string(),
      "muteThreadLabel": z.string(),
      "unmuteThreadLabel": z.string(),
      "mutedLabel": z.string(),
      "unreadBadge": z.string(),
      "types": z.object({
        "reply": z.string(),
        "like": z.string(),
        "mention": z.string(),
        "answer": z.string(),
        "follow": z.string(),
        "system": z.string()
      })
    }),
    admin_community: z.object({
      "pageTitle": z.string(),
      "tabs": z.object({
        "reports": z.string(),
        "posts": z.string(),
        "categories": z.string(),
        "badges": z.string(),
        "modLog": z.string(),
        "announcements": z.string()
      }),
      "reports": z.object({
        "statusPending": z.string(),
        "statusResolved": z.string(),
        "statusDismissed": z.string(),
        "resolveBtn": z.string(),
        "dismissBtn": z.string(),
        "emptyPending": z.string(),
        "reasonLabel": z.string(),
        "targetLabel": z.string(),
        "reporterLabel": z.string()
      }),
      "posts": z.object({
        "searchPlaceholder": z.string(),
        "pinBtn": z.string(),
        "unpinBtn": z.string(),
        "lockBtn": z.string(),
        "unlockBtn": z.string(),
        "hideBtn": z.string(),
        "unhideBtn": z.string(),
        "reasonPlaceholder": z.string(),
        "emptyState": z.string()
      }),
      "categories": z.object({
        "activeLabel": z.string(),
        "inactiveLabel": z.string(),
        "saveBtn": z.string(),
        "sortOrderLabel": z.string()
      }),
      "badges": z.object({
        "userIdLabel": z.string(),
        "badgeSlugLabel": z.string(),
        "awardBtn": z.string(),
        "successMsg": z.string(),
        "availableBadges": z.string()
      }),
      "modLog": z.object({
        "emptyState": z.string(),
        "actionLabel": z.string(),
        "targetLabel": z.string(),
        "modLabel": z.string(),
        "reasonLabel": z.string()
      }),
      "announcements": z.object({
        "titleLabel": z.string(),
        "bodyLabel": z.string(),
        "categoryLabel": z.string(),
        "postBtn": z.string(),
        "successMsg": z.string(),
        "note": z.string()
      })
    }),
    astronomical_accuracy: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      })
    }),
    tarot_card_detail: z.object({
      "labels": z.object({
        "upright": z.string(),
        "reversed": z.string(),
        "interpretations": z.string(),
        "love": z.string(),
        "career": z.string(),
        "growth": z.string(),
        "symbolism": z.string(),
        "related": z.string(),
        "cta_heading": z.string(),
        "cta_body": z.string(),
        "cta_button": z.string(),
        "all_cards": z.string()
      })
    }),
    moon_phases: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      })
    }),
    moon_event: z.object({
      "labels": z.object({
        "datetime_heading": z.string(),
        "utc_note": z.string(),
        "spiritual_theme": z.string(),
        "spellwork": z.string(),
        "how_we_calculate": z.string(),
        "cta_calendar": z.string(),
        "cta_phases": z.string(),
        "cta_rituals": z.string()
      })
    }),
    astrology_index: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "sections": z.object({
        "zodiac_heading": z.string(),
        "explore_heading": z.string()
      })
    }),
    zodiac_sign: z.object({
      "labels": z.object({
        "strengths": z.string(),
        "challenges": z.string(),
        "correspondences": z.string(),
        "compatible": z.string(),
        "all_signs": z.string(),
        "cta_heading": z.string(),
        "cta_body": z.string(),
        "cta_button": z.string()
      })
    }),
    reminders: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "labels": z.object({
        "save_button": z.string(),
        "saving": z.string(),
        "saved": z.string(),
        "consent_note": z.string(),
        "signin_heading": z.string(),
        "signin_body": z.string(),
        "signin_cta": z.string()
      })
    }),
    horoscope: z.object({
      "eyebrow": z.string(),
      "dateUpdatesNote": z.string(),
      "shareLabel": z.string(),
      "doLabel": z.string(),
      "dontLabel": z.string(),
      "signInPrompt": z.string(),
      "signInButton": z.string(),
      "noBirthDateHeading": z.string(),
      "noBirthDateBody": z.string(),
      "noBirthDateButton": z.string(),
      "loadingText": z.string(),
      "readFullLabel": z.string()
    }),
    signup: z.object({
      "heading": z.string(),
      "subheading": z.string(),
      "cta": z.string(),
      "signInPrompt": z.string(),
      "signInLink": z.string(),
      "verifyHeading": z.string(),
      "verifySubheading": z.string(),
      "verifyButton": z.string(),
      "resendPrompt": z.string(),
      "resendLink": z.string()
    }),
    account: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "header": z.object({
        "signOutButton": z.string()
      }),
      "tabs": z.object({
        "profile": z.string(),
        "security": z.string(),
        "astrology": z.string()
      }),
      "profileTab": z.object({
        "sectionTitle": z.string(),
        "uploadHint": z.string(),
        "uploadConstraints": z.string(),
        "avatarPickerTitle": z.string(),
        "publicProfileTitle": z.string(),
        "usernameLabel": z.string(),
        "bioLabel": z.string(),
        "bioPlaceholder": z.string(),
        "locationLabel": z.string(),
        "witchPathLabel": z.string(),
        "visibilityLabel": z.string(),
        "visibilityPublicLabel": z.string(),
        "visibilityPublicDesc": z.string(),
        "visibilityCovenLabel": z.string(),
        "visibilityCovenDesc": z.string(),
        "visibilityPrivateLabel": z.string(),
        "visibilityPrivateDesc": z.string(),
        "saveButton": z.string(),
        "savingButton": z.string(),
        "savedButton": z.string(),
        "viewProfileLink": z.string()
      }),
      "securityTab": z.object({
        "passwordSectionTitle": z.string(),
        "currentPasswordLabel": z.string(),
        "newPasswordLabel": z.string(),
        "confirmPasswordLabel": z.string(),
        "twoFaSectionTitle": z.string(),
        "sessionsSectionTitle": z.string(),
        "activitySectionTitle": z.string(),
        "noActivityText": z.string(),
        "noSessionsLoadedText": z.string()
      }),
      "astroTab": z.object({
        "sectionTitle": z.string(),
        "birthDateLabel": z.string(),
        "birthTimeLabel": z.string(),
        "birthLocationLabel": z.string(),
        "sunSignLabel": z.string(),
        "moonSignLabel": z.string(),
        "risingSignLabel": z.string(),
        "saveButton": z.string(),
        "savedButton": z.string()
      }),
      "twoFaModal": z.object({
        "title": z.string(),
        "choiceIntro": z.string(),
        "totpOptionTitle": z.string(),
        "totpOptionDesc": z.string(),
        "smsOptionTitle": z.string(),
        "smsOptionDesc": z.string()
      }),
      "DEFAULT_AVATARS": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "url": z.string()
      })),
      "ZODIAC_SIGNS": z.array(z.string())
    }),
    app_store_screenshots: z.object({
      "hero": z.object({
        "badge": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "toolsNote": z.object({
        "label": z.string(),
        "tools": z.string()
      }),
      "captionsSectionTitle": z.string(),
      "captionsSectionNote": z.string(),
      "footerLink": z.string(),
      "footerNote": z.string(),
      "sizes": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "size": z.string()
      })),
      "screens": z.array(z.object({
        "id": z.string(),
        "number": z.string(),
        "headline": z.string(),
        "subheadline": z.string(),
        "description": z.string(),
        "url": z.string(),
        "tags": z.string(),
        "device": z.string()
      }))
    }),
    app_store_submission: z.object({
      "hero": z.object({
        "badge": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "identity": z.object({
        "appName": z.string(),
        "subtitle": z.string(),
        "bundleId": z.string()
      }),
      "categories": z.object({
        "iosPrimary": z.string(),
        "iosSecondary": z.string(),
        "googlePrimary": z.string(),
        "contentRating": z.string()
      }),
      "descriptions": z.object({
        "promotional": z.string(),
        "short": z.string(),
        "full": z.string(),
        "whatsNew": z.string()
      }),
      "keywords": z.object({
        "ios": z.string()
      }),
      "urls": z.object({
        "marketing": z.string(),
        "support": z.string(),
        "privacy": z.string()
      }),
      "SCREENSHOT_SIZES_APPLE": z.array(z.object({
        "id": z.string(),
        "device": z.string(),
        "size": z.string(),
        "note": z.string()
      })),
      "SCREENSHOT_SIZES_GOOGLE": z.array(z.object({
        "id": z.string(),
        "device": z.string(),
        "size": z.string(),
        "note": z.string()
      })),
      "SCREENSHOT_SCREENS": z.array(z.object({
        "id": z.string(),
        "screen": z.string(),
        "desc": z.string()
      })),
      "AGE_RATING": z.array(z.object({
        "id": z.string(),
        "question": z.string(),
        "answer": z.string()
      })),
      "CHECKLIST": z.array(z.object({
        "id": z.string(),
        "item": z.string()
      })),
      "footer": z.string()
    }),
    app_launch_kit: z.object({
      "hero": z.object({
        "badge": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "banner": z.object({
        "sectionTitle": z.string(),
        "sectionNote": z.string(),
        "headline": z.string(),
        "subheadline": z.string(),
        "cta": z.string(),
        "tagline": z.string(),
        "specs": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "size": z.string(),
          "format": z.string()
        }))
      }),
      "instagram": z.object({
        "sectionTitle": z.string(),
        "sectionNote": z.string(),
        "postCaption": z.string(),
        "storyCaption": z.string(),
        "altText": z.string()
      }),
      "bluesky": z.object({
        "sectionTitle": z.string(),
        "sectionNote": z.string(),
        "post1": z.string(),
        "post2": z.string(),
        "post3": z.string()
      }),
      "email": z.object({
        "sectionTitle": z.string(),
        "sectionNote": z.string(),
        "subject": z.string(),
        "preheader": z.string(),
        "greeting": z.string(),
        "body1": z.string(),
        "body2": z.string(),
        "featuresHeading": z.string(),
        "features": z.array(z.object({
          "id": z.string(),
          "emoji": z.string(),
          "title": z.string(),
          "desc": z.string()
        })),
        "ctaText": z.string(),
        "ctaUrl": z.string(),
        "closing": z.string(),
        "signature": z.string()
      }),
      "pressRelease": z.object({
        "sectionTitle": z.string(),
        "sectionNote": z.string(),
        "dateline": z.string(),
        "headline": z.string(),
        "subheadline": z.string(),
        "body": z.string(),
        "boilerplate": z.string(),
        "contact": z.string()
      })
    }),
    profile: z.object({
      "loading": z.string(),
      "errorNotFound": z.string(),
      "errorNotFoundDesc": z.string(),
      "errorPrivate": z.string(),
      "errorPrivateDesc": z.string(),
      "goBack": z.string(),
      "joinCta": z.string(),
      "createAccount": z.string(),
      "memberSince": z.string(),
      "addToCoven": z.string(),
      "message": z.string(),
      "customize": z.string()
    }),
    forgot_password: z.object({
      "emailStep": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "emailLabel": z.string(),
        "emailPlaceholder": z.string(),
        "submitButton": z.string(),
        "submittingButton": z.string(),
        "backToSignIn": z.string()
      }),
      "codeStep": z.object({
        "title": z.string(),
        "codeLabel": z.string(),
        "continueButton": z.string(),
        "resendPrompt": z.string(),
        "resendButton": z.string(),
        "resendingButton": z.string(),
        "changeEmailButton": z.string()
      }),
      "passwordStep": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "newPasswordLabel": z.string(),
        "confirmPasswordLabel": z.string(),
        "passwordPlaceholder": z.string(),
        "passwordHint": z.string(),
        "submitButton": z.string(),
        "submittingButton": z.string()
      }),
      "doneStep": z.object({
        "title": z.string(),
        "message": z.string(),
        "signInButton": z.string()
      }),
      "sentTo": z.string()
    }),
    login: z.object({
      "title": z.string(),
      "subtitle": z.string(),
      "emailLabel": z.string(),
      "passwordLabel": z.string(),
      "forgotPassword": z.string(),
      "submitButton": z.string(),
      "submittingButton": z.string(),
      "noAccount": z.string(),
      "createAccount": z.string(),
      "twoFaTitle": z.string(),
      "twoFaSubtitle": z.string(),
      "twoFaCodeLabel": z.string(),
      "twoFaSubmitButton": z.string(),
      "twoFaVerifyingButton": z.string(),
      "twoFaBackButton": z.string()
    }),
    astrology_planets: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "live_sky": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "planets_heading": z.string(),
      "groups_heading": z.string(),
      "groups": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "planets": z.string(),
        "desc": z.string()
      }))
    }),
    astrology_houses: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "houses_heading": z.string(),
      "method_note": z.string(),
      "cta_heading": z.string(),
      "cta_body": z.string(),
      "cta_button": z.string()
    }),
    astrology_aspects: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "aspects_heading": z.string(),
      "orb_note": z.string(),
      "applying_heading": z.string(),
      "applying_body": z.string(),
      "cta_heading": z.string(),
      "cta_button": z.string()
    }),
    profile_studio: z.object({
      "title": z.string(),
      "subtitle": z.string(),
      "viewProfile": z.string(),
      "coverSection": z.string(),
      "uploadPhoto": z.string(),
      "uploading": z.string(),
      "removePhoto": z.string(),
      "avatarSection": z.string(),
      "changeAvatar": z.string(),
      "accentSection": z.string(),
      "identitySection": z.string(),
      "displayNameLabel": z.string(),
      "displayNamePlaceholder": z.string(),
      "pronounsLabel": z.string(),
      "pronounsPlaceholder": z.string(),
      "bioLabel": z.string(),
      "bioPlaceholder": z.string(),
      "locationLabel": z.string(),
      "locationPlaceholder": z.string(),
      "witchPathLabel": z.string(),
      "witchPathNone": z.string(),
      "astrologySection": z.string(),
      "sunSignLabel": z.string(),
      "moonSignLabel": z.string(),
      "risingSignLabel": z.string(),
      "interestsSection": z.string(),
      "addInterestPlaceholder": z.string(),
      "socialSection": z.string(),
      "visibilitySection": z.string(),
      "visibilityPublic": z.string(),
      "visibilityCoven": z.string(),
      "visibilityPrivate": z.string(),
      "saveChanges": z.string(),
      "saving": z.string(),
      "saved": z.string(),
      "cancel": z.string(),
      "resetDefaults": z.string(),
      "previewLabel": z.string()
    }),
    live_sky: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "howTo": z.object({
        "heading": z.string(),
        "cards": z.array(z.object({
          "id": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "planets": z.object({
        "sun": z.string(),
        "moon": z.string(),
        "mercury": z.string(),
        "venus": z.string(),
        "mars": z.string(),
        "jupiter": z.string(),
        "saturn": z.string(),
        "uranus": z.string(),
        "neptune": z.string(),
        "pluto": z.string()
      })
    }),
    cosmic_connections: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string(),
        "backLink": z.string()
      }),
      "form": z.object({
        "personALabel": z.string(),
        "personBLabel": z.string(),
        "namePlaceholder": z.string(),
        "nameLabel": z.string(),
        "dateLabel": z.string(),
        "unknownTimeLabel": z.string(),
        "timeLabel": z.string(),
        "calculateButton": z.string(),
        "loadingButton": z.string()
      }),
      "results": z.object({
        "overallLabel": z.string(),
        "strengthsTitle": z.string(),
        "growthTitle": z.string(),
        "compositeSunDesc": z.string(),
        "compositeMoonDesc": z.string(),
        "wheelCaption": z.string(),
        "noAspectsMessage": z.string(),
        "aspectCountSuffix": z.string()
      }),
      "intro": z.object({
        "synastryTitle": z.string(),
        "synastryDesc": z.string(),
        "scoresTitle": z.string(),
        "scoresDesc": z.string(),
        "narrativeTitle": z.string(),
        "narrativeDesc": z.string()
      })
    }),
    celestial_time_machine: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "title": z.string(),
        "subtitle": z.string(),
        "backLink": z.string()
      }),
      "controls": z.object({
        "dateLabel": z.string(),
        "timeLabel": z.string(),
        "timezoneLabel": z.string(),
        "locationLabel": z.string(),
        "latLabel": z.string(),
        "lonLabel": z.string(),
        "detectButton": z.string(),
        "goButton": z.string(),
        "loadingButton": z.string(),
        "presetLabel": z.string()
      }),
      "results": z.object({
        "skyDomeTitle": z.string(),
        "planetsTitle": z.string(),
        "eventsTitle": z.string(),
        "riseSetTitle": z.string(),
        "filterPlanets": z.string(),
        "filterConstellations": z.string(),
        "filterStars": z.string(),
        "aboveHorizon": z.string(),
        "belowHorizon": z.string(),
        "retrograde": z.string(),
        "direct": z.string(),
        "circumpolar": z.string(),
        "alwaysBelow": z.string(),
        "noEvents": z.string()
      })
    }),
    seo_guide_birth_chart: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_sun_moon_rising: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_houses: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_moon_sign: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_tarot_beginners: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_three_card: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_arcana: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_moon_phases: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_moon_rituals: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_moon_calendar: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_witchcraft: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    seo_guide_grimoire: z.object({
      "slug": z.string(),
      "title": z.string(),
      "description": z.string(),
      "h1": z.string(),
      "publishedDate": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string()
      }))
    }),
    user_profile: z.object({
      "loading": z.string(),
      "notFound": z.string(),
      "notFoundDesc": z.string(),
      "unavailable": z.string(),
      "unavailableDesc": z.string(),
      "goBack": z.string(),
      "customize": z.string(),
      "message": z.string(),
      "inviteToCoven": z.string(),
      "covenMember": z.string(),
      "invited": z.string(),
      "acceptInvite": z.string(),
      "memberSince": z.string(),
      "noPathDesc": z.string(),
      "covenPlaceholder": z.string(),
      "favoritesPlaceholder": z.string(),
      "galleryAlt": z.string()
    }),
    community_discover: z.object({
      "title": z.string(),
      "subtitle": z.string(),
      "searchPlaceholder": z.string(),
      "noResults": z.string(),
      "noMembers": z.string(),
      "viewProfile": z.string(),
      "inviteToCoven": z.string(),
      "invited": z.string(),
      "accept": z.string(),
      "loadMore": z.string()
    }),
    admin_roles: z.object({
      "title": z.string(),
      "subtitle": z.string(),
      "tabMembers": z.string(),
      "tabAudit": z.string(),
      "searchPlaceholder": z.string(),
      "filterAll": z.string(),
      "loadMore": z.string(),
      "noMembers": z.string(),
      "auditSubtitle": z.string(),
      "badgesLabel": z.string(),
      "manageLabel": z.string(),
      "badgeManagementTitle": z.string(),
      "badgeReasonPlaceholder": z.string(),
      "officialLabel": z.string(),
      "interestLabel": z.string(),
      "confirmPrefix": z.string(),
      "confirmRoleLabel": z.string(),
      "confirmAccountTypeLabel": z.string(),
      "confirmTo": z.string(),
      "reasonPlaceholder": z.string(),
      "cancelLabel": z.string(),
      "applyLabel": z.string(),
      "roleLabel": z.string(),
      "accountTypeLabel": z.string(),
      "loadingLabel": z.string(),
      "accessDenied": z.string(),
      "accessDeniedDesc": z.string()
    }),
    creator_application: z.object({
      "pageTitle": z.string(),
      "pageSubtitle": z.string(),
      "eligibilityTitle": z.string(),
      "eligibilityDesc": z.string(),
      "identityLabel": z.string(),
      "identityNote": z.string(),
      "accountTypeLabel": z.string(),
      "accountTypeCreatorLabel": z.string(),
      "accountTypeCreatorDesc": z.string(),
      "accountTypeOrgLabel": z.string(),
      "accountTypeOrgDesc": z.string(),
      "creatorNameLabel": z.string(),
      "creatorNamePlaceholder": z.string(),
      "contactEmailLabel": z.string(),
      "contactEmailPlaceholder": z.string(),
      "contactEmailNote": z.string(),
      "websiteLabel": z.string(),
      "websitePlaceholder": z.string(),
      "socialsLabel": z.string(),
      "socialsNote": z.string(),
      "otherSocialLabel": z.string(),
      "otherSocialPlaceholder": z.string(),
      "categoryLabel": z.string(),
      "categoryPlaceholder": z.string(),
      "workDescLabel": z.string(),
      "workDescPlaceholder": z.string(),
      "samplesLabel": z.string(),
      "samplesNote": z.string(),
      "samplesPlaceholder": z.string(),
      "reasonLabel": z.string(),
      "reasonPlaceholder": z.string(),
      "notesLabel": z.string(),
      "notesPlaceholder": z.string(),
      "privacyTitle": z.string(),
      "privacyDesc": z.string(),
      "agreementText": z.string(),
      "guidelinesLink": z.string(),
      "agreementAnd": z.string(),
      "privacyLink": z.string(),
      "signInRequired": z.string(),
      "signInDesc": z.string(),
      "signInButton": z.string(),
      "successTitle": z.string(),
      "successDesc": z.string(),
      "referenceLabel": z.string(),
      "backToCommunity": z.string(),
      "backLink": z.string(),
      "submitButton": z.string(),
      "submitting": z.string()
    }),
    explore: z.object({
      "heading": z.string(),
      "recentLabel": z.string(),
      "popularLabel": z.string()
    }),
    creators: z.object({
      "hero": z.object({
        "badge": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "ctaPrimary": z.string(),
        "ctaSecondary": z.string()
      }),
      "whoSection": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "benefitsSection": z.object({
        "heading": z.string()
      }),
      "stepsSection": z.object({
        "heading": z.string()
      }),
      "orgCta": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "faqSection": z.object({
        "heading": z.string()
      })
    }),
    organizations: z.object({
      "hero": z.object({
        "badge": z.string(),
        "heading": z.string(),
        "subheading": z.string(),
        "ctaPrimary": z.string(),
        "ctaSecondary": z.string()
      }),
      "typesSection": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "benefitsSection": z.object({
        "heading": z.string()
      }),
      "stepsSection": z.object({
        "heading": z.string()
      }),
      "creatorCta": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "faqSection": z.object({
        "heading": z.string()
      })
    }),
    circles: z.object({
      "hero": z.object({
        "badge": z.string(),
        "title": z.string(),
        "subtitle": z.string()
      }),
      "circles": z.array(z.object({
        "id": z.string(),
        "icon": z.string(),
        "name": z.string(),
        "description": z.string(),
        "memberLabel": z.string()
      })),
      "cta": z.object({
        "title": z.string(),
        "subtitle": z.string()
      })
    }),
    tarot_share: z.object({
      "unavailableTitle": z.string(),
      "unavailableBody": z.string(),
      "unavailableCta": z.string(),
      "sectionLabel": z.string(),
      "ctaHeading": z.string(),
      "ctaBody": z.string(),
      "ctaButton": z.string(),
      "disclaimer": z.string(),
      "reversedLabel": z.string()
    }),
    admin_dashboard: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "heading": z.string(),
      "subheading": z.string()
    }),
    admin_applications: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "heading": z.string(),
      "subheading": z.string()
    }),
    admin_moderator: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "heading": z.string(),
      "subheading": z.string()
    }),
    admin_community_admin: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "heading": z.string(),
      "subheading": z.string()
    }),
    account_applications: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "heading": z.string(),
      "subheading": z.string()
    }),
    plus: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "headline": z.string(),
        "subheading": z.string()
      }),
      "pricing": z.object({
        "name": z.string(),
        "price": z.string(),
        "billingNote": z.string(),
        "primaryCta": z.string(),
        "secondaryCta": z.string()
      }),
      "benefits": z.array(z.object({
        "id": z.string(),
        "key": z.string(),
        "title": z.string(),
        "description": z.string(),
        "status": z.string(),
        "icon": z.string()
      })),
      "whyFree": z.object({
        "heading": z.string(),
        "body": z.string()
      }),
      "faq": z.array(z.object({
        "id": z.string(),
        "question": z.string(),
        "answer": z.string()
      })),
      "comparison": z.object({
        "freeLabel": z.string(),
        "plusLabel": z.string(),
        "freeItems": z.array(z.string()),
        "plusItems": z.array(z.string())
      })
    })
  }
};
export type Schemas = typeof schemas;