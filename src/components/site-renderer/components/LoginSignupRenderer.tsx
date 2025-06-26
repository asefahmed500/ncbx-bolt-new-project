
import type { IPageComponent } from '@/models/PageComponent';

interface LoginSignupRendererProps {
  config: IPageComponent['config'];
}

const LoginSignupRenderer: React.FC<LoginSignupRendererProps> = ({ config }) => {
  const title = config?.title || 'Join Our Community';
  const description = config?.description || 'Sign up to get access to exclusive content and features.';
  const loginButtonText = config?.loginButtonText || 'Login';
  const signupButtonText = config?.signupButtonText || 'Sign Up Free';

  return (
    <section className="py-12 md:py-16 bg-background text-foreground">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-headline mb-3">{title}</h2>
        <p className="text-muted-foreground mb-8">{description}</p>
        <div className="flex justify-center gap-4">
          <a href="/login" className="px-6 py-2.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
            {loginButtonText}
          </a>
          <a href="/register" className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            {signupButtonText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default LoginSignupRenderer;
