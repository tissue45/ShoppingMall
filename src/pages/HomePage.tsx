import React from 'react'
import HeroBanner from '../components/HeroBanner'
import WeeklyFocus from '../components/WeeklyFocus'

const HomePage: React.FC = () => {
  console.log('🏠 HomePage 컴포넌트 렌더링 시작')
  
  return (
    <div className="w-full">
      <HeroBanner />
      <WeeklyFocus />
    </div>
  )
}

export default HomePage