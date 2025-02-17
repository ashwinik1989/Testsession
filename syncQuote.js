import { LightningElement, api, track } from 'lwc';
import syncQuoteWithOpportunity from '@salesforce/apex/QuoteSyncController.syncQuoteWithOpportunity';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getQuoteDetails from '@salesforce/apex/QuoteSyncController.getQuoteDetails'; // Get quote details for modal
import { refreshApex } from 'lightning/uiRecordApi'; // For refreshing component data if necessary

export default class SyncQuote extends LightningElement {
    @api recordId; // The Quote recordId passed to the LWC
    @track isModalOpen = false; 
    @track quoteName = ''; 
    @track opportunityName = ''; 
    @track isQuoteAlreadySynced = false;
    @track syncMessage = ''; // Message to display in the modal
    @track syncMessage2 = '';
    connectedCallback() {
        this.checkIfQuoteIsSynced(); // Check if the quote is already synced when the component is loaded
    }

    // Opens the modal
    openModal() {
        this.isModalOpen = true;
        //this.checkIfQuoteIsSynced();
    }

    // Close the modal
    closeModal() {
        this.isModalOpen = false;
    }

    // Fetch Quote details and check if it's already synced
    checkIfQuoteIsSynced() {
        getQuoteDetails({ quoteId: this.recordId })
            .then((result) => {
                this.quoteName = result.Name;
                this.opportunityName = result.Opportunity_Name__r.Name;

                // Check if the quote is already synced
                if (result.IsSyncing__c) {
                    this.isQuoteAlreadySynced = true;
                    this.syncMessage = `Quote "${this.quoteName}" is already synced with Opportunity "${this.opportunityName}".`;
                } else {
                    this.isQuoteAlreadySynced = false;
                    this.syncMessage = `Do you want to sync Quote "${this.quoteName}" with Opportunity "${this.opportunityName}"?`;
                }
            })
            .catch((error) => {
                console.error('Error fetching quote details:', error);
                this.showToastMessage('Error fetching quote details', 'error');
            });
    }

    // Sync the quote with the opportunity
    syncQuote() {
        if (this.isQuoteAlreadySynced) {
            this.showToastMessage('Error: This Quote is already synced with an Opportunity.', 'error');
            this.closeModal();
            return;
        }

        // Call the Apex method to sync the quote with the opportunity
        syncQuoteWithOpportunity({ quoteId: this.recordId })
            .then((result) => {
                // Show success toast with the message returned from Apex
                this.showToastMessage(result, 'success');
                this.closeModal();
            })
            .catch((error) => {
                console.error('Error syncing quote:', error);

                // Check if the error has a body and a message
                let errorMessage = 'Error syncing the quote'; // Default error message
                if (error.body && error.body.message) {
                    errorMessage = error.body.message; // If the error contains a message, use it
                }

             // Show error message from Apex
                this.showToastMessage(errorMessage, 'error');
                this.closeModal();
            });
    }

    // Show toast message
    showToastMessage(message, variant) {
        const event = new ShowToastEvent({
            title: variant === 'success' ? 'Success' : 'Error',
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}