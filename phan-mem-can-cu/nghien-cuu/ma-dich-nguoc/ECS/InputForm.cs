using System;
using System.ComponentModel;
using System.Windows.Forms;

namespace ECS;

public class InputForm : Form
{
	private IContainer components;

	public TextBox inputTextBox;

	private Button okButton;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.InputForm));
		this.okButton = new System.Windows.Forms.Button();
		this.inputTextBox = new System.Windows.Forms.TextBox();
		base.SuspendLayout();
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.inputTextBox, "inputTextBox");
		this.inputTextBox.Name = "inputTextBox";
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.inputTextBox);
		base.Controls.Add(this.okButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "InputForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(InputForm_Load);
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public InputForm()
	{
		InitializeComponent();
	}

	private void InputForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_PleaseInput");
		okButton.Text = Program.GetLang("pw_OK");
	}
}
