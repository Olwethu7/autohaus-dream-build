import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";
import { NewsletterSignup } from "./NewsletterSignup";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold text-gold-foreground">
              <span className="font-display text-lg font-bold">M</span>
            </div>
            <div className="font-display text-lg font-bold">MLG Autohaus</div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">
            Premium pre-owned & franchise vehicles. Trusted dealership serving South Africa.
          </p>
          <div className="mt-6 max-w-sm">
            <NewsletterSignup />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Browse</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/catalogue" className="hover:text-gold">Catalogue</Link></li>
            <li><Link to="/finance" className="hover:text-gold">Finance Calculator</Link></li>
            <li><Link to="/sell" className="hover:text-gold">Sell Your Car</Link></li>
            <li><Link to="/test-drive" search={{ vehicleId: "" }} className="hover:text-gold">Book Test Drive</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Visit Us</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-gold" /> Visit our showroom in Durban</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> 031 942 1272</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> info@mlgauto.co.za</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} MLG Autohaus. All rights reserved.</p>
          <p>Mon–Fri 8:00–17:00 · Sat 9:00–13:00</p>
        </div>
      </div>
    </footer>
  );
}
