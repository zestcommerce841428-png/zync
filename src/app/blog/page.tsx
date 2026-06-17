import type { Metadata } from 'next'
import Container from '@mui/material/Container'
import PageShell from '../../components/PageShell'
import BlogIndex from '../../components/BlogIndex'
import { getAllPostMeta, getCategories } from '../../blog'
import { brand } from '../../brand'

export const metadata: Metadata = {
  title: 'Blog',
  description: `Guides on private file sharing, security, WebRTC, productivity and web development from the ${brand.name} team.`,
  alternates: { canonical: '/blog' },
}

export default function BlogPage(): React.ReactElement {
  const posts = getAllPostMeta()
  const categories = getCategories()
  return (
    <>
      <PageShell
        title={`The ${brand.name} Blog`}
        subtitle="Privacy, file sharing, and the web — explained."
      />
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
        <BlogIndex posts={posts} categories={categories} />
      </Container>
    </>
  )
}
