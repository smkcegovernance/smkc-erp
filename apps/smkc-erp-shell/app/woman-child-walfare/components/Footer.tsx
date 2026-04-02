export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-content">
          <p>&copy; {currentYear} सांगली मिरज आणि कुपवाड शहर महानगरपालिका. सर्व हक्क राखीव.</p>
          <p className="small">दिव्यांग सक्षमीकरण अभियान</p>
        </div>
      </div>
    </footer>
  )
}
