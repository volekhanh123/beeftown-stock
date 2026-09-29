using System;
using System.ComponentModel;
using System.Net;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class AddressForm : Form
{
	private IContainer components;

	private Button okButton;

	private NumericUpDown portNumericUpDown;

	private TextBox ipTextBox;

	private Button cancelButton;

	private Label ipLabel;

	private Label portLabel;

	public IPEndPoint Address
	{
		get
		{
			int port = (int)portNumericUpDown.Value;
			try
			{
				return new IPEndPoint(IPAddress.Parse(ipTextBox.Text), port);
			}
			catch (FormatException ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				return new IPEndPoint(IPAddress.None, port);
			}
		}
	}

	public AddressForm()
	{
		InitializeComponent();
	}

	private void AddressForm_Load(object sender, EventArgs e)
	{
		cancelButton.Text = Program.GetLang("pw_Cancel");
		ipLabel.Text = Program.GetLang("pw_IPAddress");
		okButton.Text = Program.GetLang("pw_OK");
		portLabel.Text = Program.GetLang("pw_PortNumber");
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.AddressForm));
		this.ipLabel = new System.Windows.Forms.Label();
		this.portLabel = new System.Windows.Forms.Label();
		this.okButton = new System.Windows.Forms.Button();
		this.portNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.ipTextBox = new System.Windows.Forms.TextBox();
		this.cancelButton = new System.Windows.Forms.Button();
		((System.ComponentModel.ISupportInitialize)this.portNumericUpDown).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.ipLabel, "ipLabel");
		this.ipLabel.Name = "ipLabel";
		resources.ApplyResources(this.portLabel, "portLabel");
		this.portLabel.Name = "portLabel";
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.portNumericUpDown, "portNumericUpDown");
		this.portNumericUpDown.Maximum = new decimal(new int[4] { 65535, 0, 0, 0 });
		this.portNumericUpDown.Minimum = new decimal(new int[4] { 1024, 0, 0, 0 });
		this.portNumericUpDown.Name = "portNumericUpDown";
		this.portNumericUpDown.Value = ECS.Properties.Settings.Default.tcpClientPort;
		resources.ApplyResources(this.ipTextBox, "ipTextBox");
		this.ipTextBox.Name = "ipTextBox";
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.ipLabel);
		base.Controls.Add(this.ipTextBox);
		base.Controls.Add(this.portNumericUpDown);
		base.Controls.Add(this.portLabel);
		base.Controls.Add(this.okButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "AddressForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(AddressForm_Load);
		((System.ComponentModel.ISupportInitialize)this.portNumericUpDown).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
