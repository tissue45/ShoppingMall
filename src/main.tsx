import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 React 앱 시작 중...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('root element를 찾을 수 없습니다!')
  }

  console.log('✅ root element 찾음')
  
  const root = ReactDOM.createRoot(rootElement)
  console.log('✅ React root 생성됨')

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  
  console.log('✅ React 앱 렌더링 시작')
} catch (error) {
  console.error('❌ React 앱 초기화 실패:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>앱 초기화 오류</h1>
      <p>${error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      <button onclick="window.location.reload()">새로고침</button>
    </div>
  `
}