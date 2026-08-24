export function ContactForm() {
  return (
    <form className="php-email-form" onSubmit={(event) => event.preventDefault()}>
      <div className="row gy-4">
        <div className="col-md-6">
          <input type="text" name="name" className="form-control" placeholder="Your Name" required />
        </div>
        <div className="col-md-6">
          <input type="email" name="email" className="form-control" placeholder="Your Email" required />
        </div>
        <div className="col-md-12">
          <input type="text" name="subject" className="form-control" placeholder="Subject" required />
        </div>
        <div className="col-md-12">
          <textarea name="message" className="form-control" rows="6" placeholder="Message" required />
        </div>
        <div className="col-md-12 text-center">
          <button type="submit">Send Message</button>
        </div>
      </div>
    </form>
  );
}

export function QuoteForm() {
  return (
    <form className="php-email-form" onSubmit={(event) => event.preventDefault()}>
      <h3>Get a quote</h3>
      <p>Request shipping details, delivery cities, and project information from this React form.</p>
      <div className="row gy-4">
        <div className="col-md-6"><input type="text" name="departure" className="form-control" placeholder="City of Departure" required /></div>
        <div className="col-md-6"><input type="text" name="delivery" className="form-control" placeholder="Delivery City" required /></div>
        <div className="col-md-6"><input type="text" name="weight" className="form-control" placeholder="Total Weight (kg)" required /></div>
        <div className="col-md-6"><input type="text" name="dimensions" className="form-control" placeholder="Dimensions (cm)" required /></div>
        <div className="col-lg-12"><h4>Your Personal Details</h4></div>
        <div className="col-12"><input type="text" name="name" className="form-control" placeholder="Name" required /></div>
        <div className="col-12"><input type="email" name="email" className="form-control" placeholder="Email" required /></div>
        <div className="col-12"><input type="text" name="phone" className="form-control" placeholder="Phone" required /></div>
        <div className="col-12"><textarea name="message" className="form-control" rows="6" placeholder="Message" required /></div>
        <div className="col-12 text-center">
          <button type="submit">Get a quote</button>
        </div>
      </div>
    </form>
  );
}