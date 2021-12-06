// BoostPublish API Class
const Postmate = require('postmate');
const Helpers = require('../utils/helpers');
const VERSION = '1.1.4';

class BoostPublish {
	// Initializes the widget after page load
	async init() {
		console.log('BoostPOW Publish ' + VERSION + ' initialized.');
		Helpers.addStyle(
			`.boostPublishFrame {
				border: none;
				overflow: hidden;
				width: 0px;
				height: 0px;
				position: fixed;
				bottom: 0;
				left: 0;
			}`,
			'head'
		);

		// Postmate iframe wrapper
		this.child = await new Postmate({
			name: 'boostpow-publish',
			container: document.body,
			url: 'https://publish.boost.pow.co', // 'http://localhost:4000',
			classListArray: ['boostPublishFrame'],
			model: { fromPowPublish: true }
		});

		// direct link to the iframe
		this.iframe = this.child.frame;
		this.didInit = true;
	}

	displayIframe() {
		Helpers.displayElem(this.iframe);
	}

	hideIframe() {
		Helpers.hideElem(this.iframe);
	}

	// Opens the widget using the props configuration object
	async open(props) {
		// If trying to open before init, keep trying each 200 miliseconds until the widget initializes
		if (!this.didInit) {
			await Helpers.sleep(200);
			this.open(props);
			return;
		}

		// Prepares callbacks
		let onCryptoOperations;
		let onError;
		let onPayment;

		if (props.moneybuttonProps && props.moneybuttonProps.onCryptoOperations) {
			onCryptoOperations = props.moneybuttonProps.onCryptoOperations;
			delete props.moneybuttonProps.onCryptoOperations;
		}

		if (props.onPayment) {
			onPayment = props.onPayment;
			delete props.onPayment;
		}

		if (props.onError) {
			onError = props.onError;
			delete props.onError;
		}

		this.child.call('open', props);
		this.displayIframe();

		const self = this;
		return new Promise((resolve, reject) => {
			self.child.on('opened', props => {
				self.child.call('opened', props);
			});
			self.child.on('close', () => {
				self.child.call('close');
				self.hideIframe();
				return resolve();
			});
			self.child.on('payment', ({ payment }) => {
				self.hideIframe();
				onPayment && onPayment(payment);
				return resolve(payment);
			});
			self.child.on('error', ({ error }) => {
				self.hideIframe();
				onError && onError(error);
				return reject(error);
			});
			self.child.on('cryptoOperations', ({ cryptoOperations }) => {
				self.hideIframe();
				return onCryptoOperations && onCryptoOperations(cryptoOperations);
			});
		});
	}
}

const boostPublish = new BoostPublish();
module.exports = boostPublish;
