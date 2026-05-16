import { redirect } from 'next/navigation'

// Legacy route — kept so old history links don't 404
export default function GeneratorRedirect() {
  redirect('/teacher')
}
