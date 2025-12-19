import { createElement } from 'react'
import Login from './components/Login.js'

const App = () => {
    return createElement(
        'div',
        { className: 'min-h-screen bg-gray-50 flex items-center justify-center font-sans' },
        createElement(Login)
    )
}

export default App
