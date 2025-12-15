import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CloudArrowUp, ArrowDownTray, CheckCircle, ExclamationCircle, InformationCircle } from "@/components/icons";
import { BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ProcessingResult, BatchProcessingResponse } from "@shared/schema";

import ex1Image from "@assets/ex1_1763843307394.jpg";
import up1Image from "@assets/up1_1763843512735.jpg";
import up2Image from "@assets/up2_1763843512735.jpg";
import up3Image from "@assets/up3_1763843512735.jpg";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lowestPricePercentage, setLowestPricePercentage] = useState<string>("80");
  const [currentPricePercentage, setCurrentPricePercentage] = useState<string>("100");
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lowestPricePercentage", lowestPricePercentage);
      formData.append("currentPricePercentage", currentPricePercentage);

      const response = await apiRequest(
        "POST",
        "/api/process",
        formData
      );
      return await response.json() as BatchProcessingResponse;
    },
    onSuccess: (data) => {
      setResults(data.results);
      toast({
        title: "Processing Complete",
        description: `Successfully updated ${data.successCount} items. ${data.failedCount} items need manual review.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      parsePreview(droppedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parsePreview(selectedFile);
    }
  }, []);

  const parsePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // Header + 5 rows
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {} as any);
      });
      setPreviewData(rows.filter(row => row.itKey)); // Filter out empty rows
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData([]);
    setResults([]);
  };

  const handleDownloadSuccessful = async () => {
    try {
      const response = await fetch('/api/download/successful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: results.filter(r => r.status === 'success') }),
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'successful_updates.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download successful items CSV",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFailed = async () => {
    try {
      const response = await fetch('/api/download/failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: results.filter(r => r.status === 'failed') }),
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manual_review_required.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download items for review CSV",
        variant: "destructive",
      });
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const totalCount = results.length;
  const progressPercentage = totalCount > 0 ? (successCount + failedCount) / totalCount * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-foreground">CSV Price Updater</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-how-to">
                  <BookOpen className="w-4 h-4 mr-2" />
                  How To
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Step-by-Step Tutorial</DialogTitle>
                  <DialogDescription>
                    Learn how to export CSV from Edge POS and import updated prices back
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="export" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="export">Export from Edge</TabsTrigger>
                    <TabsTrigger value="import">Import Back to Edge</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="export" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Step 1: Open Item Data Export</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          In Edge POS, navigate to <span className="font-mono bg-accent px-1 rounded">Utilities</span> → <span className="font-mono bg-accent px-1 rounded">Item Data Export</span>
                        </p>
                        <img src={ex1Image} alt="Open Item Data Export" className="rounded-lg border border-border w-full" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Step 2: Configure Export Settings</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          In the Item Data Export Wizard:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                          <li>Select <span className="font-semibold">Export By Item Key</span></li>
                          <li>Choose your save location</li>
                          <li>Set delimiter to <span className="font-semibold">Comma</span></li>
                          <li>Check <span className="font-semibold">Include Quotes in Data Output</span></li>
                          <li>Select <span className="font-semibold">Export Item Data</span></li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Step 3: Filter Items by Vendor</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Apply filters to export only the items you need (e.g., vendor GA - Gabriel&Co.)
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Step 4: Review and Export</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Review the selected items and click <span className="font-semibold">Export</span> to save the CSV file
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="import" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Step 1: Open Item Data Import</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          After processing your CSV in this tool, go to Edge POS → <span className="font-mono bg-accent px-1 rounded">Utilities</span> → <span className="font-mono bg-accent px-1 rounded">Item Data Import</span>
                        </p>
                        <img src={up1Image} alt="Open Item Data Import" className="rounded-lg border border-border w-full" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Step 2: Select Updated CSV File</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          In the Item Data Import Wizard:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                          <li>Select <span className="font-semibold">Import By Item Key</span></li>
                          <li>Browse to your downloaded <span className="font-mono bg-accent px-1 rounded">successful_updates.csv</span> file</li>
                          <li>Set delimiter to <span className="font-semibold">Comma</span></li>
                          <li>Select <span className="font-semibold">Import Item Data</span></li>
                        </ul>
                        <img src={up2Image} alt="Configure import settings" className="rounded-lg border border-border w-full mt-3" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Step 3: Review Import Preview</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Verify the data looks correct in the preview screen, then click <span className="font-semibold">Next</span> to complete the import
                        </p>
                        <img src={up3Image} alt="Review import preview" className="rounded-lg border border-border w-full" />
                      </div>
                      
                      <div className="bg-accent p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">⚠️ Important Notes:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                          <li>Ensure Edge is not being used on other workstations during import</li>
                          <li>You will have the option to backup your database before import begins</li>
                          <li>Only import the <span className="font-mono bg-accent px-1 rounded">successful_updates.csv</span> file</li>
                          <li>Review items in <span className="font-mono bg-accent px-1 rounded">manual_review_required.csv</span> separately</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload your POS CSV file to automatically fetch retail prices and calculate derived pricing
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">1. Upload CSV File</CardTitle>
            <CardDescription>
              Drag and drop your CSV file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? 'border-primary bg-accent' : 'border-border hover-elevate'
                }`}
                data-testid="upload-dropzone"
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <CloudArrowUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files only</p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-chart-2" />
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid="text-filename">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRemoveFile}
                    data-testid="button-remove-file"
                  >
                    Remove
                  </Button>
                </div>

                {previewData.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <InformationCircle className="w-4 h-4" />
                      Preview (first 5 rows)
                    </p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-medium">Item Key</TableHead>
                              <TableHead className="font-medium">Vendor Code</TableHead>
                              <TableHead className="font-medium">Description</TableHead>
                              <TableHead className="font-medium">Retail Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-xs">{row.itKey}</TableCell>
                                <TableCell className="font-mono text-xs">{row.itVendStyleCode}</TableCell>
                                <TableCell className="text-xs">{row.itDesc?.substring(0, 50)}...</TableCell>
                                <TableCell className="font-mono text-xs">${row.itRetailPrice}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">2. Configure Pricing Percentages</CardTitle>
            <CardDescription>
              Set the percentages for calculating lowest and current prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lowest-price" className="text-sm font-medium">
                  Lowest Price %
                </Label>
                <div className="relative">
                  <Input
                    id="lowest-price"
                    type="number"
                    min="0"
                    max="100"
                    value={lowestPricePercentage}
                    onChange={(e) => setLowestPricePercentage(e.target.value)}
                    className="pr-8"
                    placeholder="80"
                    data-testid="input-lowest-percentage"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculated as: Retail Price × {lowestPricePercentage}%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-price" className="text-sm font-medium">
                  Current Price %
                </Label>
                <div className="relative">
                  <Input
                    id="current-price"
                    type="number"
                    min="0"
                    max="100"
                    value={currentPricePercentage}
                    onChange={(e) => setCurrentPricePercentage(e.target.value)}
                    className="pr-8"
                    placeholder="100"
                    data-testid="input-current-percentage"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculated as: Retail Price × {currentPricePercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">3. Process Updates</CardTitle>
            <CardDescription>
              Fetch prices from the website and calculate updated values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => processMutation.mutate()}
              disabled={!file || processMutation.isPending}
              className="w-full md:w-auto"
              data-testid="button-process"
            >
              {processMutation.isPending ? 'Processing...' : 'Process Updates'}
            </Button>

            {processMutation.isPending && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing items...</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-medium">4. Results</CardTitle>
                  <CardDescription>
                    Review updated prices and download CSV files
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownloadSuccessful}
                    disabled={successCount === 0}
                    className="gap-2"
                    data-testid="button-download-successful"
                  >
                    <ArrowDownTray className="w-4 h-4" />
                    Download Successful ({successCount})
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadFailed}
                    disabled={failedCount === 0}
                    className="gap-2"
                    data-testid="button-download-failed"
                  >
                    <ArrowDownTray className="w-4 h-4" />
                    Download For Review ({failedCount})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">Status</TableHead>
                        <TableHead className="font-medium">Item Key</TableHead>
                        <TableHead className="font-medium">Vendor Code</TableHead>
                        <TableHead className="font-medium">Original Price</TableHead>
                        <TableHead className="font-medium">Fetched Price</TableHead>
                        <TableHead className="font-medium">Lowest Price</TableHead>
                        <TableHead className="font-medium">Current Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {result.status === 'success' ? (
                              <Badge variant="default" className="bg-chart-2 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <ExclamationCircle className="w-3 h-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs" data-testid={`text-itkey-${index}`}>
                            {result.row.itKey}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {result.row.itVendStyleCode}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            ${result.row.itRetailPrice}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {result.fetchedPrice !== null ? `$${result.fetchedPrice.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {result.calculatedLowestPrice !== null 
                              ? `$${result.calculatedLowestPrice.toFixed(2)}` 
                              : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {result.calculatedCurrentPrice !== null 
                              ? `$${result.calculatedCurrentPrice.toFixed(2)}` 
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {failedCount > 0 && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <ExclamationCircle className="w-4 h-4 text-destructive" />
                    <span className="font-medium">{failedCount} items failed to update</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    These items require manual review. Download the CSV file to see details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
