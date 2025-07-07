/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useActiveAddress } from '@arweave-wallet-kit/react';
import RequireLogin from '../components/RequireLogin';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { getAdminRooms, getAdminRoomMembers, getAdminRoomDocuments, getAdminRoomDocumentsSignatures, getAdminRoomRoles, getAdminRolePermissions } from '../services/adminActionsClient';
import { CustomLoader } from '../components/ui/CustomLoader';
import { AlertCircle, ShieldBan, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Generic Data View Component
const DataView = ({ fetcher, columns, filterFields, activeAddress }: { fetcher: (params: any) => Promise<any>, columns: { key: string, label: string }[], filterFields: { key: string, label: string }[], activeAddress: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(0);

  const fetchData = useCallback(async (currentPage: number, currentFilters: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher({ callerAddress: activeAddress, page: currentPage, ...currentFilters });
      if (result.success && result.data) {
        // The data key is plural (e.g., 'rooms', 'members')
        const dataKey = Object.keys(result.data).find(k => Array.isArray(result.data[k]));
        if (dataKey) {
            setData(result.data[dataKey]);
            setTotal(result.data.total);
            setPage(result.data.page);
            setLimit(result.data.limit);
        } else {
            throw new Error("Data array not found in response");
        }
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, activeAddress]);

  useEffect(() => {
    fetchData(1, appliedFilters);
  }, [fetchData, appliedFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(total / limit)) {
      fetchData(newPage, appliedFilters);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4 mb-4">
          {filterFields.map(field => (
            <Input
              key={field.key}
              placeholder={`Filter by ${field.label}...`}
              value={filters[field.key] || ''}
              onChange={(e) => handleFilterChange(field.key, e.target.value)}
              className="max-w-xs"
            />
          ))}
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
        
        {isLoading ? (
            <div className="flex justify-center items-center py-10">
                 <CustomLoader size={48} text="Loading Data..." />
            </div>
        ) : error ? (
            <div className="text-red-500 flex items-center gap-2">
                <AlertCircle /> {error}
            </div>
        ) : (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map(col => <TableCell key={col.key}>{String(row[col.key] ?? 'N/A')}</TableCell>)}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(total / limit) || 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                    <ChevronsLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= Math.ceil(total / limit)}>
                    Next <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};


export default function AdminPage() {
  const activeAddress = useActiveAddress();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (activeAddress) {
        setIsCheckingAuth(true);
        try {
          // Use one of the fetchers as a canary request to check auth
          await getAdminRooms({ callerAddress: activeAddress, page: 1 });
          setIsAuthorized(true);
        } catch (error) {
          setIsAuthorized(false);
        } finally {
          setIsCheckingAuth(false);
        }
      } else if (activeAddress === null) {
        // User is not logged in
        setIsCheckingAuth(false);
        setIsAuthorized(false);
      }
    };
    checkAuthorization();
  }, [activeAddress]);

  if (isCheckingAuth) {
     return (
        <div className="container mx-auto p-4 md:p-8 flex justify-center items-center h-[60vh]">
            <CustomLoader size={48} text="Verifying authorization..." />
        </div>
     )
  }

  if (!isAuthorized) {
    return (
        <RequireLogin>
            <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                <Card className="bg-destructive/10 border-destructive">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <ShieldBan className="w-8 h-8 text-destructive" />
                        <div>
                            <CardTitle>Access Denied</CardTitle>
                            <CardDescription>Your connected wallet is not authorized to view this page.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
          </div>
        </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <Tabs defaultValue="rooms">
          <TabsList>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <DataView fetcher={getAdminRooms} activeAddress={activeAddress!}
              columns={[{ key: 'roomId', label: 'Room ID' }, { key: 'roomName', label: 'Room Name' }, { key: 'ownerEmail', label: 'Owner' }, { key: 'createdAt', label: 'Created At' }]}
              filterFields={[{ key: 'roomName', label: 'Room Name' }, { key: 'ownerEmail', label: 'Owner Email' }]} />
          </TabsContent>
          <TabsContent value="members">
            <DataView fetcher={getAdminRoomMembers} activeAddress={activeAddress!}
              columns={[{ key: 'roomId', label: 'Room ID' }, { key: 'userEmail', label: 'User Email' }, { key: 'role', label: 'Role' }]}
              filterFields={[{ key: 'roomId', label: 'Room ID' }, { key: 'userEmail', label: 'User Email' }]} />
          </TabsContent>
           <TabsContent value="documents">
            <DataView fetcher={getAdminRoomDocuments} activeAddress={activeAddress!}
              columns={[{ key: 'documentId', label: 'Document ID' }, { key: 'roomId', label: 'Room ID' }, { key: 'uploaderEmail', label: 'Uploader' }, { key: 'originalFilename', label: 'Filename' }, { key: 'category', label: 'Category' }]}
              filterFields={[{ key: 'roomId', label: 'Room ID' }, { key: 'uploaderEmail', label: 'Uploader Email' }]} />
          </TabsContent>
           <TabsContent value="signatures">
            <DataView fetcher={getAdminRoomDocumentsSignatures} activeAddress={activeAddress!}
              columns={[{ key: 'documentId', label: 'Document ID' }, { key: 'roomId', label: 'Room ID' }, { key: 'emailToSign', label: 'Signer Email' }, { key: 'signed', label: 'Signed' }]}
              filterFields={[{ key: 'roomId', label: 'Room ID' }, { key: 'documentId', label: 'Document ID' }]} />
          </TabsContent>
           <TabsContent value="roles">
            <DataView fetcher={getAdminRoomRoles} activeAddress={activeAddress!}
              columns={[{ key: 'roomId', label: 'Room ID' }, { key: 'roleName', label: 'Role Name' }, { key: 'isDeletable', label: 'Deletable' }]}
              filterFields={[{ key: 'roomId', label: 'Room ID' }]} />
          </TabsContent>
           <TabsContent value="permissions">
            <DataView fetcher={getAdminRolePermissions} activeAddress={activeAddress!}
              columns={[{ key: 'roomId', label: 'Room ID' }, { key: 'roleName', label: 'Role Name' }, { key: 'documentType', label: 'Document Type' }]}
              filterFields={[{ key: 'roomId', label: 'Room ID' }]} />
          </TabsContent>
        </Tabs>
      </div>
    </RequireLogin>
  );
} 