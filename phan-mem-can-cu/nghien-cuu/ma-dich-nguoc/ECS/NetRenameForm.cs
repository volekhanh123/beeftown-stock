using System;
using System.ComponentModel;
using System.Windows.Forms;

namespace ECS;

public class NetRenameForm : Form
{
	public string shopName;

	public string machineName;

	public int machineNo;

	private IContainer components;

	private NumericUpDown machineNoNumericUpDown;

	private Label shopNameLabel;

	private Label machineNoLabel;

	private Button okButton;

	private Label machineNameLabel;

	private TextBox shopNameTextBox;

	private TextBox machineNameTextBox;

	private Button cancelButton;

	public NetRenameForm(string shopName, string machineName, int machineNo)
	{
		InitializeComponent();
		this.shopName = (shopNameTextBox.Text = shopName);
		this.machineName = (machineNameTextBox.Text = machineName);
		this.machineNo = machineNo;
		machineNoNumericUpDown.Value = machineNo;
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		shopName = shopNameTextBox.Text.Trim();
		machineName = machineNameTextBox.Text.Trim();
		machineNo = (int)machineNoNumericUpDown.Value;
	}

	private void NetRenameForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Rename");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		machineNameLabel.Text = Program.GetLang("pw_MachineName");
		machineNoLabel.Text = Program.GetLang("pw_MachineNo");
		okButton.Text = Program.GetLang("pw_OK");
		shopNameLabel.Text = Program.GetLang("pw_ShopName");
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.NetRenameForm));
		this.machineNoNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.shopNameLabel = new System.Windows.Forms.Label();
		this.machineNoLabel = new System.Windows.Forms.Label();
		this.okButton = new System.Windows.Forms.Button();
		this.machineNameLabel = new System.Windows.Forms.Label();
		this.shopNameTextBox = new System.Windows.Forms.TextBox();
		this.machineNameTextBox = new System.Windows.Forms.TextBox();
		this.cancelButton = new System.Windows.Forms.Button();
		((System.ComponentModel.ISupportInitialize)this.machineNoNumericUpDown).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.machineNoNumericUpDown, "machineNoNumericUpDown");
		this.machineNoNumericUpDown.Maximum = new decimal(new int[4] { 999999, 0, 0, 0 });
		this.machineNoNumericUpDown.Minimum = new decimal(new int[4] { 999999, 0, 0, -2147483648 });
		this.machineNoNumericUpDown.Name = "machineNoNumericUpDown";
		resources.ApplyResources(this.shopNameLabel, "shopNameLabel");
		this.shopNameLabel.Name = "shopNameLabel";
		resources.ApplyResources(this.machineNoLabel, "machineNoLabel");
		this.machineNoLabel.Name = "machineNoLabel";
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		resources.ApplyResources(this.machineNameLabel, "machineNameLabel");
		this.machineNameLabel.Name = "machineNameLabel";
		resources.ApplyResources(this.shopNameTextBox, "shopNameTextBox");
		this.shopNameTextBox.Name = "shopNameTextBox";
		resources.ApplyResources(this.machineNameTextBox, "machineNameTextBox");
		this.machineNameTextBox.Name = "machineNameTextBox";
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.machineNoNumericUpDown);
		base.Controls.Add(this.shopNameLabel);
		base.Controls.Add(this.machineNoLabel);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.machineNameLabel);
		base.Controls.Add(this.shopNameTextBox);
		base.Controls.Add(this.machineNameTextBox);
		base.Name = "NetRenameForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(NetRenameForm_Load);
		((System.ComponentModel.ISupportInitialize)this.machineNoNumericUpDown).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
