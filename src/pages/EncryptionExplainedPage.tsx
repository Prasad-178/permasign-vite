import { ShieldCheck, KeyRound, FileLock, Eye, UserPlus, Server, Cloud } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import AppFooter from '../components/AppFooter';

const KmsLink = () => (
    <a href="https://cloud.google.com/security/products/security-key-management?hl=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
        KMS
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
      <main className="container mx-auto max-w-5xl py-12 px-4">
        <section className="text-center mb-16">
          <ShieldCheck className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Our Commitment to Your Security
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            At PermaSign, the security and privacy of your high-value agreements are our highest priority. We've engineered a multi-layered encryption strategy to ensure that your data is protected at every step. This page provides a transparent overview of our security architecture.
          </p>
        </section>

        <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">The Encryption Flow at a Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <Card className="flex flex-col items-center p-6">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <KeyRound className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">1. Secure Company Space Creation</h3>
                    <p className="text-muted-foreground mt-2 text-sm">Each company space gets a unique encryption key pair, with the private key protected by Google's Key Management Service (KMS).</p>
                </Card>
                <Card className="flex flex-col items-center p-6">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <FileLock className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">2. Document Upload</h3>
                    <p className="text-muted-foreground mt-2 text-sm">Every document is encrypted with its own unique key before being permanently stored on Arweave, which is then encrypted by the room's public key before storage.</p>
                </Card>
                <Card className="flex flex-col items-center p-6">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <Eye className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">3. Document Retrieval</h3>
                    <p className="text-muted-foreground mt-2 text-sm">A secure, multi-step decryption process ensures only authorized parties can decrypt and view documents.</p>
                </Card>
                 <Card className="flex flex-col items-center p-6">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <UserPlus className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">4. Member Access</h3>
                    <p className="text-muted-foreground mt-2 text-sm">Transparent role-based AO access control on AO ensures members can only perform actions permitted by their role.</p>
                </Card>
            </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-8">A Deeper Dive into Our Encryption Process</h2>
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full max-w-4xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-4">1</span>
                  Creating a Secure Room
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2">
                <p className="text-muted-foreground mb-6">When a new room (for a company or project) is created, we establish a unique cryptographic identity for it. This ensures that all data within that room is isolated and independently secured.</p>
                <div className="space-y-4">
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-green-900" />}
                        color="bg-green-200"
                        title="Generate Room Key Pair"
                        description="We create a unique public/private key pair (RSA-OAEP-2048) for each room. The public key is used to encrypt data being added to the room, while the private key is required to decrypt it."
                    />
                    <Step 
                        icon={<ShieldCheck className="w-6 h-6 text-blue-900" />}
                        color="bg-blue-200"
                        title="Secure Private Key with KMS"
                        description={<>The room's private key, the master key for the room, is itself encrypted using a highly secure, centrally managed symmetric key from Google Cloud's <KmsLink />. This means even our database doesn't store the raw private key.</>}
                    />
                     <Step 
                        icon={<Server className="w-6 h-6 text-indigo-900" />}
                        color="bg-indigo-200"
                        title="Store Keys Securely"
                        description={<>The room's public key and the <strong className="font-semibold">encrypted</strong> private key are stored in our database, associated with the room. The unencrypted private key never touches our persistent storage.</>}
                    />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-4">2</span>
                  Uploading a Document
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2">
                <p className="text-muted-foreground mb-6">We practice defense-in-depth by ensuring that every single document has its own layer of encryption, separate from other documents in the same room.</p>
                 <div className="space-y-4">
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-green-900" />}
                        color="bg-green-200"
                        title="Generate Document Key"
                        description="For each file you upload, we generate a brand new, unique symmetric key (AES-256-GCM). This key will be used specifically for this document."
                    />
                    <Step 
                        icon={<FileLock className="w-6 h-6 text-yellow-900" />}
                        color="bg-yellow-200"
                        title="Encrypt the Document"
                        description="The content of your document is encrypted using this newly generated document-specific key."
                    />
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-blue-900" />}
                        color="bg-blue-200"
                        title="Encrypt the Document Key"
                        description="To store the document key safely, we encrypt it using the room's public key. The document can only be decrypted by an authorized member with access to the room's private key."
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
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-4">3</span>
                  Retrieving & Viewing a Document
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2">
                <p className="text-muted-foreground mb-6">Viewing a document is a carefully orchestrated process that reverses the encryption flow, with multiple security checks along the way. Your data is only ever decrypted in-memory, just-in-time for viewing.</p>
                <div className="space-y-4">
                    <Step 
                        icon={<ShieldCheck className="w-6 h-6 text-blue-900" />}
                        color="bg-blue-200"
                        title="Decrypt Room Private Key"
                        description={<>When an authorized member requests a document, we first retrieve the encrypted room private key from our database. This is sent to Google <KmsLink />, which decrypts it and returns the plaintext room private key.</>}
                    />
                    <Step 
                        icon={<KeyRound className="w-6 h-6 text-green-900" />}
                        color="bg-green-200"
                        title="Decrypt Document Key"
                        description="Next, we retrieve the encrypted document key. Using the now-decrypted room private key, we decrypt the document key in-memory."
                    />
                    <Step 
                        icon={<FileLock className="w-6 h-6 text-yellow-900" />}
                        color="bg-yellow-200"
                        title="Decrypt Document"
                        description="Finally, we fetch the encrypted document from Arweave. Using the decrypted document key, we decrypt the document's contents. This decrypted data is streamed directly to you and is never stored on our servers."
                    />
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