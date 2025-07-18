import { ShieldCheck, KeyRound, FileLock, Eye, UserPlus, Server, Cloud, Trash2, Timer } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import AppFooter from '../components/AppFooter';
import ScrollToTop from '../components/ScrollToTop';

const KmsLink = () => (
    <a href="https://cloud.google.com/security/products/security-key-management?hl=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
        Google Cloud KMS
    </a>
);

const Step = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: React.ReactNode; color: string }) => (
    <div className="flex items-start space-x-4 p-4 rounded-lg transition-colors hover:bg-muted/50">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-lg">{title}</h4>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);


export default function EncryptionExplainedPage() {
  return (
    <div className="bg-background text-foreground">
      <ScrollToTop />
      <main className="container mx-auto max-w-5xl py-16 px-4">
        <section className="text-center mb-20">
          <ShieldCheck className="mx-auto h-20 w-20 text-primary animate-vault-glow" />
          <h1 className="mt-6 text-4xl font-bold tracking-tighter sm:text-5xl">
            Our Commitment to Your Security
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-muted-foreground">
            At PermaSign, the security and privacy of your high-value agreements are our highest priority. We've engineered a multi-layered encryption strategy to ensure that your data is protected at every step. This page provides a transparent overview of our security architecture.
          </p>
        </section>

        <section className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">The Encryption Flow at a Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <Card className="flex flex-col items-center p-6 security-feature-card">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <KeyRound className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">1. Secure Room Creation</h3>
                    <p className="text-muted-foreground mt-2 text-sm">Each company space gets a unique encryption key pair, with the private key protected by <KmsLink />.</p>
                </Card>
                <Card className="flex flex-col items-center p-6 security-feature-card">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <FileLock className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">2. Document Encryption</h3>
                    <p className="text-muted-foreground mt-2 text-sm">Every document is encrypted with its own unique key before being permanently stored on Arweave.</p>
                </Card>
                <Card className="flex flex-col items-center p-6 security-feature-card">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <Eye className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">3. Secure Retrieval</h3>
                    <p className="text-muted-foreground mt-2 text-sm">A secure, multi-step decryption process ensures only authorized members can view documents.</p>
                </Card>
                 <Card className="flex flex-col items-center p-6 security-feature-card">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <UserPlus className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">4. Member Access Control</h3>
                    <p className="text-muted-foreground mt-2 text-sm">On-chain, role-based access control ensures members can only perform permitted actions.</p>
                </Card>
            </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">A Deeper Dive into Our Encryption Process</h2>
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full max-w-4xl mx-auto security-accordion">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xl font-semibold security-accordion-trigger">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mr-4 font-bold">1</span>
                  Creating a Secure Room
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 pb-4 text-base">
                <p className="text-muted-foreground mb-6">When a new room is created, we establish a unique cryptographic identity for it. This ensures that all data within that room is isolated and independently secured.</p>
                <div className="space-y-4">
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-green-900" />}
                        color="bg-green-200"
                        title="Generate Room Key Pair"
                        description="We create a unique public/private key pair (RSA-OAEP-2048) for each room. The public key is used to encrypt data, while the private key is required to decrypt it."
                    />
                    <Step 
                        icon={<ShieldCheck className="w-6 h-6 text-blue-900" />}
                        color="bg-blue-200"
                        title="Secure Private Key with KMS"
                        description={<>The room's private key is encrypted using a master key from <KmsLink />. This means even our database doesn't store the raw, usable private key.</>}
                    />
                     <Step 
                        icon={<Server className="w-6 h-6 text-indigo-900" />}
                        color="bg-indigo-200"
                        title="Store Keys Securely"
                        description={<>The room's public key and the <strong className="font-semibold">encrypted</strong> private key are stored in our database. The unencrypted private key never touches our persistent storage.</>}
                    />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl font-semibold security-accordion-trigger">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mr-4 font-bold">2</span>
                  Uploading a Document
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 pb-4 text-base">
                <p className="text-muted-foreground mb-6">We practice defense-in-depth by ensuring that every single document has its own layer of encryption, separate from other documents in the same room.</p>
                 <div className="space-y-4">
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-green-900" />}
                        color="bg-green-200"
                        title="Generate Document-Specific Key"
                        description="For each file you upload, we generate a brand new, unique symmetric key (AES-256-GCM). This key is used only for this one document."
                    />
                    <Step 
                        icon={<FileLock className="w-6 h-6 text-yellow-900" />}
                        color="bg-yellow-200"
                        title="Encrypt the Document"
                        description="The content of your document is encrypted on your device using this newly generated document-specific key before it is ever uploaded."
                    />
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-blue-900" />}
                        color="bg-blue-200"
                        title="Encrypt the Document Key"
                        description="To store the document key safely, we encrypt it using the room's public key. Only an authorized member with access to the room's private key can decrypt it."
                    />
                     <Step 
                        icon={<Cloud className="w-6 h-6 text-purple-900" />}
                        color="bg-purple-200"
                        title="Store on Arweave"
                        description="The encrypted document is uploaded to Arweave for permanent, decentralized storage. We then store the Arweave transaction ID and the encrypted document key in our database."
                    />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-xl font-semibold security-accordion-trigger">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mr-4 font-bold">3</span>
                  Retrieving & Viewing a Document
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 pb-4 text-base">
                <p className="text-muted-foreground mb-6">Viewing a document is a carefully orchestrated process that reverses the encryption flow, with multiple security checks. Your data is only ever decrypted in-memory, just-in-time for viewing.</p>
                <div className="space-y-4">
                    <Step 
                        icon={<ShieldCheck className="w-6 h-6 text-blue-900" />}
                        color="bg-blue-200"
                        title="Decrypt Room Private Key via KMS"
                        description={<>When an authorized member requests a document, we send the encrypted room private key to <KmsLink />, which verifies the request and returns the decrypted room key.</>}
                    />
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-green-900" />}
                        color="bg-green-200"
                        title="Decrypt Document Key"
                        description="Using the now-decrypted room private key, we decrypt the document-specific key. This happens entirely in-memory on our secure server."
                    />
                    <Step 
                        icon={<FileLock className="w-6 h-6 text-yellow-900" />}
                        color="bg-yellow-200"
                        title="Decrypt Document for Viewing"
                        description="Finally, we fetch the encrypted document from Arweave and use the decrypted document key to decrypt its contents. This decrypted data is streamed directly to your browser and is never stored on our servers."
                    />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-xl font-semibold security-accordion-trigger">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mr-4 font-bold">4</span>
                  Secure Document Caching
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 pb-4 text-base">
                <p className="text-muted-foreground mb-6">To enhance performance while maintaining security, we temporarily cache decrypted documents in your browser's memory. This cache is carefully managed to protect your data.</p>
                <div className="space-y-4">
                    <Step 
                        icon={<Timer className="w-6 h-6 text-orange-900" />}
                        color="bg-orange-200"
                        title="Time-Limited Cache (TTL)"
                        description="Decrypted documents are stored in a temporary in-memory cache for a short period (15 minutes). After this time, they are automatically and securely purged."
                    />
                    <Step 
                        icon={<Trash2 className="w-6 h-6 text-red-900" />}
                        color="bg-red-200"
                        title="Secure Deletion & Cleanup"
                        description="When a document expires or the cache is cleared, we perform a secure deletion by attempting to overwrite the data in memory before release. A cleanup process runs every 3 minutes to enforce this."
                    />
                     <Step 
                        icon={<Eye className="w-6 h-6 text-gray-900" />}
                        color="bg-gray-200"
                        title="Least Recently Used (LRU) Eviction"
                        description="The cache has a maximum size (8 documents). If full, the least recently accessed document is securely removed to make space, ensuring efficient memory use."
                    />
                    <div className="doc-cache-warning mt-6 p-4 rounded-lg">
                      <p className="font-semibold text-destructive-foreground">The decrypted documents are only ever stored on your local device's memory and are automatically cleared when you close the browser tab. They are never stored on our servers or any other persistent storage.</p>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </main>
      <AppFooter />
    </div>
  );
}