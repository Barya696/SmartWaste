import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

interface AdminMobileBlockProps {
  children: React.ReactNode;
}

export function AdminMobileBlock({ children }: AdminMobileBlockProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Monitor className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h2 className="text-xl mb-4 text-card-foreground">
            Administration Panel
          </h2>
          <p className="text-muted-foreground mb-6">
            Pour accéder au panneau d'administration, veuillez utiliser un ordinateur ou une tablette.
          </p>
          <p className="text-muted-foreground text-sm">
            The admin panel requires a larger screen for optimal functionality. Please use a computer or tablet to access administrative features.
          </p>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              SmartWaste ParkCactive
              <br />
              Republic of Congo
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
