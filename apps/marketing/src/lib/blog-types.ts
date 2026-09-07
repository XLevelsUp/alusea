// Mirrors the shape of blog_posts JSON columns as written by the admin app.
// Duplicated here (not shared) since marketing and admin are independent apps.

export type BlogSubsection = {
  heading: string
  body_html: string
}

export type BlogSection = {
  heading: string
  body_html: string
  subsections: BlogSubsection[]
}

export type BlogQA = {
  question: string
  answer: string
}

export type BlogCtaButton = {
  label: string
  href: string
}

export type BlogCta = {
  intro: string
  buttons: BlogCtaButton[]
}

export type ImageFit = 'cover' | 'contain'
